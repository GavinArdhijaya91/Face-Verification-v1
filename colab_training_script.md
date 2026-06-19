# 1. Setup Environment
!pip install torch torchvision opencv-python albumentations tqdm pandas

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
from tqdm import tqdm

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

BATCH_SIZE = 64
EPOCHS = 10
EMBEDDING_SIZE = 512
NUM_CLASSES = 5749 

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

# 4. Dataset Loader
from torchvision.datasets import ImageFolder
import zipfile

zip_paths = ['LFW - Dataset.zip', 'CelebA-20260619T160407Z-3-002.zip']
extracted_dir = 'dataset_extracted'

if not os.path.exists(extracted_dir):
    os.makedirs(extracted_dir, exist_ok=True)

for zip_path in zip_paths:
    if os.path.exists(zip_path):
        print(f"Extracting {zip_path}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extracted_dir)
        print(f"Extraction of {zip_path} complete.")
    else:
        print(f"Warning: {zip_path} not found.")

transform = transforms.Compose([
    transforms.Resize((112, 112)),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

dataset = ImageFolder(root=extracted_dir, transform=transform)

NUM_CLASSES = len(dataset.classes)
print(f"Number of classes found: {NUM_CLASSES}")

dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

# 5. Training Loop
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
    }, f"checkpoint_epoch_{epoch}.pth")

# 6. Save to Google Drive
from google.colab import drive
drive.mount('/content/drive')
!cp checkpoint_epoch_9.pth /content/drive/MyDrive/
