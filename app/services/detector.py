from facenet_pytorch import MTCNN
from PIL import Image
import numpy as np

class FaceDetector:
    def __init__(self, device='cpu'):
        self.mtcnn = MTCNN(keep_all=False, device=device)

    def detect_and_crop(self, image: Image.Image):
        boxes, probs, landmarks = self.mtcnn.detect(image, landmarks=True)
        
        if boxes is None or len(boxes) == 0:
            return None, None, None
            
        box = boxes[0].tolist()
        landmark = landmarks[0].tolist() if landmarks is not None else None
        
        x1, y1, x2, y2 = [int(b) for b in box]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(image.width, x2), min(image.height, y2)
        cropped_face = image.crop((x1, y1, x2, y2))
            
        return cropped_face, box, landmark
