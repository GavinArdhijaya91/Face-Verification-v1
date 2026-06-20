# 1. Setup Environment
!apt-get install p7zip-full -y
!pip install torch torchvision opencv-python albumentations tqdm pandas gdown

# 2. Imports and Configuration
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision.models import resnet50, ResNet50_Weights
import torchvision.transforms as transforms
from PIL import Image
import math
import torch.nn.functional as F
import os
import zipfile
import subprocess
from tqdm import tqdm

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

BATCH_SIZE = 64
EPOCHS = 10
EMBEDDING_SIZE = 512

# 3. Define Models (ResNet50 Backbone + ArcFace Head)
class ResNet50Backbone(nn.Module):
    def __init__(self, embedding_size=512):
        super(ResNet50Backbone, self).__init__()
        resnet = resnet50(weights=ResNet50_Weights.DEFAULT)
        self.features = nn.Sequential(*list(resnet.children())[:-1])
        self.embedding = nn.Linear(resnet.fc.in_features, embedding_size)
        self.bn = nn.BatchNorm1d(embedding_size)

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.embedding(x)
        x = self.bn(x)
        return x

class ArcFace(nn.Module):
    def __init__(self, embedding_size=512, num_classes=1000, s=64.0, m=0.50):
        super(ArcFace, self).__init__()
        self.s = s
        self.m = m
        self.weight = nn.Parameter(torch.FloatTensor(num_classes, embedding_size))
        nn.init.xavier_uniform_(self.weight)

        self.cos_m = math.cos(m)
        self.sin_m = math.sin(m)
        self.th = math.cos(math.pi - m)
        self.mm = math.sin(math.pi - m) * m

    def forward(self, embeddings, label):
        cosine = F.linear(F.normalize(embeddings), F.normalize(self.weight))
        sine = torch.sqrt((1.0 - torch.pow(cosine, 2)).clamp(0, 1))
        
        phi = cosine * self.cos_m - sine * self.sin_m
        phi = torch.where(cosine > self.th, phi, cosine - self.mm)
        
        one_hot = torch.zeros(cosine.size(), device=embeddings.device)
        one_hot.scatter_(1, label.view(-1, 1).long(), 1)
        
        output = (one_hot * phi) + ((1.0 - one_hot) * cosine)
        output *= self.s
        return output

# 4. Dataset Extractor & Download
extracted_dir = 'dataset_extracted'
if not os.path.exists(extracted_dir):
    os.makedirs(extracted_dir, exist_ok=True)

# A. Extract regular ZIPs (LFW & CelebA outer ZIP)
zip_paths = ['LFW - Dataset.zip', 'CelebA-20260619T160407Z-3-002.zip']
for zip_path in zip_paths:
    if os.path.exists(zip_path):
        print(f"Extracting {zip_path}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extracted_dir)
        print(f"Extraction of {zip_path} complete.")

# B. Download CelebA Identities from Github (So we know who is who)
identity_txt_path = 'identity_CelebA.txt'
if not os.path.exists(identity_txt_path):
    print("Downloading identity_CelebA.txt...")
    !wget -q https://raw.githubusercontent.com/yhw-yhw/yhw-yhw.github.io/master/identity_CelebA.txt -O identity_CelebA.txt

# C. Extract nested 7z for CelebA images
print("Searching for split 7z archives (img_celeba.7z.001)...")
celeba_7z_start = None
for root, dirs, files in os.walk(extracted_dir):
    for f in files:
        if f.endswith('.7z.001'):
            celeba_7z_start = os.path.join(root, f)
            break

if celeba_7z_start:
    print(f"Found CelebA 7z archive at: {celeba_7z_start}. Extracting via p7zip...")
    # This will automatically chain .002, .003, etc.
    subprocess.run(['7z', 'x', celeba_7z_start, f'-o{extracted_dir}/CelebA_images/', '-y'])
    print("CelebA images extracted!")

# 5. Smart Dataset Loader
class UnifiedFaceDataset(Dataset):
    def __init__(self, root_dir, celeba_identity_file=None, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.image_paths = []
        self.labels = []
        
        self.classes = set()
        valid_exts = ('.jpg', '.jpeg', '.png', '.ppm', '.bmp', '.pgm', '.tif', '.tiff', '.webp')
        
        celeba_mapping = {}
        if celeba_identity_file and os.path.exists(celeba_identity_file):
            with open(celeba_identity_file, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        celeba_mapping[parts[0]] = f"CelebA_{parts[1]}"
            print(f"Loaded {len(celeba_mapping)} CelebA identities mapping.")
        
        print("Scanning dataset directories to build class mapping...")
        for dirpath, _, filenames in os.walk(root_dir):
            for f in filenames:
                if f.lower().endswith(valid_exts):
                    is_celeba = "celeba" in dirpath.lower()
                    
                    if is_celeba and f in celeba_mapping:
                        class_name = celeba_mapping[f]
                    elif is_celeba and f not in celeba_mapping:
                        # Skip flat CelebA images if they aren't mapped (prevents grouping 200k images as 1 person)
                        continue
                    else:
                        # LFW: parent folder is the identity
                        parent_folder = os.path.basename(dirpath)
                        class_name = f"LFW_{parent_folder}"

                    self.classes.add(class_name)
                    self.image_paths.append(os.path.join(dirpath, f))
                    
        self.classes = sorted(list(self.classes))
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
        
        for path in self.image_paths:
            f = os.path.basename(path)
            dirpath = os.path.dirname(path)
            is_celeba = "celeba" in dirpath.lower()
            
            if is_celeba and f in celeba_mapping:
                class_name = celeba_mapping[f]
            else:
                parent_folder = os.path.basename(dirpath)
                class_name = f"LFW_{parent_folder}"
                
            self.labels.append(self.class_to_idx[class_name])
            
        print(f"Found {len(self.image_paths)} images across {len(self.classes)} unique identities.")

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        image = Image.open(img_path).convert('RGB')
        label = self.labels[idx]
        if self.transform:
            image = self.transform(image)
        return image, label

transform = transforms.Compose([
    transforms.Resize((112, 112)),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

dataset = UnifiedFaceDataset(root_dir=extracted_dir, celeba_identity_file=identity_txt_path, transform=transform)
NUM_CLASSES = len(dataset.classes)
print(f"Total Model Output Classes (Identities): {NUM_CLASSES}")
dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

# 6. Training Loop
backbone = ResNet50Backbone(embedding_size=EMBEDDING_SIZE).to(device)
head = ArcFace(embedding_size=EMBEDDING_SIZE, num_classes=NUM_CLASSES).to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.SGD([
    {'params': backbone.parameters()},
    {'params': head.parameters()}
], lr=0.01, momentum=0.9, weight_decay=5e-4)

for epoch in range(EPOCHS):
    backbone.train()
    head.train()
    total_loss = 0
    progress_bar = tqdm(dataloader, desc=f"Epoch {epoch+1}/{EPOCHS}")
    
    for images, labels in progress_bar:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        
        embeddings = backbone(images)
        outputs = head(embeddings, labels)
        
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        progress_bar.set_postfix({'loss': loss.item()})
        
    print(f"Epoch {epoch+1} Loss: {total_loss/len(dataloader)}")
    
    torch.save({
        'epoch': epoch,
        'backbone_state_dict': backbone.state_dict(),
        'head_state_dict': head.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'num_classes': NUM_CLASSES
    }, f"checkpoint_epoch_{epoch}.pth")

# 7. Save to Google Drive
from google.colab import drive
drive.mount('/content/drive')
!cp checkpoint_epoch_9.pth /content/drive/MyDrive/
