from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import shutil
import os

router = APIRouter(prefix="/verify", tags=["verification"])

@router.post("/")
async def verify_faces(files: List[UploadFile] = File(...)):
    if len(files) != 2:
        raise HTTPException(status_code=400, detail="Exactly two files are required for verification.")
    
    static_dir = os.path.join("app", "static", "uploads")
    os.makedirs(static_dir, exist_ok=True)
    
    path1 = os.path.join(static_dir, "subject_1.png")
    path2 = os.path.join(static_dir, "subject_2.png")
    
    with open(path1, "wb") as buffer:
        shutil.copyfileobj(files[0].file, buffer)
        
    with open(path2, "wb") as buffer:
        shutil.copyfileobj(files[1].file, buffer)
        
    return {
        "similarity": 0.85,
        "label": "Mirip sekali",
        "distance": 0.23,
        "confidence": 0.98,
        "faces": [
            {
                "box": {"left": 25, "top": 20, "width": 50, "height": 60},
                "landmarks": [
                    {"x": 40, "y": 42, "label": "Left Eye"},
                    {"x": 60, "y": 42, "label": "Right Eye"},
                    {"x": 50, "y": 55, "label": "Nose"},
                    {"x": 42, "y": 68, "label": "Mouth Left"},
                    {"x": 58, "y": 68, "label": "Mouth Right"}
                ]
            },
            {
                "box": {"left": 23, "top": 18, "width": 54, "height": 62},
                "landmarks": [
                    {"x": 39, "y": 40, "label": "Left Eye"},
                    {"x": 61, "y": 40, "label": "Right Eye"},
                    {"x": 50, "y": 53, "label": "Nose"},
                    {"x": 41, "y": 66, "label": "Mouth Left"},
                    {"x": 59, "y": 66, "label": "Mouth Right"}
                ]
            }
        ]
    }


