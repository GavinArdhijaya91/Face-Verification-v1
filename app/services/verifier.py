import numpy as np
import torch
import torchvision.transforms as transforms
from PIL import Image
from app.models.resnet50_backbone import ResNet50Backbone
import os

class Verifier:
    def __init__(self, model_path: str = "checkpoint_epoch_9.pth"):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        self.model = ResNet50Backbone(embedding_size=512)
        
        if os.path.exists(model_path):
            checkpoint = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(checkpoint['backbone_state_dict'])
            
        self.model.to(self.device)
        self.model.eval()
        
        self.transform = transforms.Compose([
            transforms.Resize((112, 112)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
        ])

    def extract_embedding(self, face_image: Image.Image):
        img_tensor = self.transform(face_image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            embedding = self.model(img_tensor)
            
        return embedding.cpu().numpy().flatten()

    def calculate_similarity(self, emb1, emb2):
        dot_product = np.dot(emb1, emb2)
        norm_a = np.linalg.norm(emb1)
        norm_b = np.linalg.norm(emb2)
        return float(dot_product / (norm_a * norm_b))
    
    def classify(self, similarity: float):
        if similarity <= 0.20:
            return "Tidak mirip sama sekali"
        elif similarity <= 0.40:
            return "Tidak mirip"
        elif similarity <= 0.60:
            return "Mirip"
        else:
            return "Mirip sekali"
