from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import shutil
import os
from PIL import Image
import io

from app.services.detector import FaceDetector
from app.services.verifier import Verifier

router = APIRouter(prefix="/verify", tags=["verification"])

detector = FaceDetector()
verifier = Verifier(model_path="checkpoint_epoch_9.pth")

@router.post("/")
async def verify_faces(files: List[UploadFile] = File(...)):
    if len(files) != 2:
        raise HTTPException(status_code=400, detail="Exactly two files are required for verification.")
    
    static_dir = os.path.join("app", "static", "uploads")
    os.makedirs(static_dir, exist_ok=True)
    
    path1 = os.path.join(static_dir, "subject_1.png")
    path2 = os.path.join(static_dir, "subject_2.png")
    
    contents1 = await files[0].read()
    contents2 = await files[1].read()
    
    with open(path1, "wb") as buffer:
        buffer.write(contents1)
    with open(path2, "wb") as buffer:
        buffer.write(contents2)
        
    try:
        img1 = Image.open(io.BytesIO(contents1)).convert('RGB')
        img2 = Image.open(io.BytesIO(contents2)).convert('RGB')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    cropped1, box1, lm1 = detector.detect_and_crop(img1)
    if cropped1 is None:
        raise HTTPException(status_code=400, detail="Wajah tidak terdeteksi di gambar pertama.")

    cropped2, box2, lm2 = detector.detect_and_crop(img2)
    if cropped2 is None:
        raise HTTPException(status_code=400, detail="Wajah tidak terdeteksi di gambar kedua.")

    emb1 = verifier.extract_embedding(cropped1)
    emb2 = verifier.extract_embedding(cropped2)
    
    cosine_sim = verifier.calculate_similarity(emb1, emb2)
    percentage = max(0.0, min(100.0, ((cosine_sim + 0.2) / 1.2) * 100))
    label = verifier.classify(cosine_sim)

    w1, h1 = img1.width, img1.height
    w2, h2 = img2.width, img2.height

    def format_landmarks(lm, w, h):
        if not lm:
            return []
        labels = ["Left Eye", "Right Eye", "Nose", "Mouth Left", "Mouth Right"]
        return [{"x": float((point[0]/w)*100), "y": float((point[1]/h)*100), "label": labels[i]} for i, point in enumerate(lm)]

    return {
        "similarity": float(percentage / 100.0),
        "confidence": float(percentage / 100.0),
        "distance": float(max(0.0, 1.0 - cosine_sim)),
        "raw_cosine": float(cosine_sim),
        "label": label,
        "faces": [
            {
                "box": {
                    "left": float((box1[0]/w1)*100), 
                    "top": float((box1[1]/h1)*100), 
                    "width": float(((box1[2]-box1[0])/w1)*100), 
                    "height": float(((box1[3]-box1[1])/h1)*100)
                },
                "landmarks": format_landmarks(lm1, w1, h1)
            },
            {
                "box": {
                    "left": float((box2[0]/w2)*100), 
                    "top": float((box2[1]/h2)*100), 
                    "width": float(((box2[2]-box2[0])/w2)*100), 
                    "height": float(((box2[3]-box2[1])/h2)*100)
                },
                "landmarks": format_landmarks(lm2, w2, h2)
            }
        ]
    }
