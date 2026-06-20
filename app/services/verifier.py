import numpy as np
from insightface.app import FaceAnalysis
import onnxruntime as ort

class Verifier:
    def __init__(self):
        self.app = FaceAnalysis(name='buffalo_l')
        providers = ort.get_available_providers()
        ctx_id = 0 if 'CUDAExecutionProvider' in providers else -1
        # Mengurangi det_size menjadi 320x320 agar jauh lebih cepat di CPU
        self.app.prepare(ctx_id=ctx_id, det_size=(320, 320))

    def analyze(self, image_np):
        faces = self.app.get(image_np)
        return faces

    def calculate_similarity(self, emb1, emb2):
        dot_product = np.dot(emb1, emb2)
        norm_a = np.linalg.norm(emb1)
        norm_b = np.linalg.norm(emb2)
        return float(dot_product / (norm_a * norm_b))
    
    def classify(self, similarity: float):
        if similarity <= 0.20:
            return "Tidak mirip sama sekali"
        elif similarity <= 0.35:
            return "Tidak mirip"
        elif similarity <= 0.50:
            return "Mirip"
        else:
            return "Mirip sekali"
