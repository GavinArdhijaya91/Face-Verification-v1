import numpy as np

class Verifier:
    def __init__(self, model_path: str = None):
        pass

    def extract_embedding(self, face_image):
        """
        Extracts 512-dimensional embedding from aligned face.
        """
        return np.random.rand(512)

    def calculate_similarity(self, emb1, emb2):
        """
        Calculate cosine similarity between two embeddings.
        Returns similarity (0.0 to 1.0)
        """
        dot_product = np.dot(emb1, emb2)
        norm_a = np.linalg.norm(emb1)
        norm_b = np.linalg.norm(emb2)
        return float(dot_product / (norm_a * norm_b))
    
    def classify(self, similarity: float):
        if similarity <= 0.30:
            return "Tidak mirip sama sekali"
        elif similarity <= 0.55:
            return "Tidak mirip"
        elif similarity <= 0.75:
            return "Mirip"
        else:
            return "Mirip sekali"
