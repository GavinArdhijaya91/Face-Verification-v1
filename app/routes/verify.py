from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

router = APIRouter(prefix="/verify", tags=["verification"])

@router.post("/")
async def verify_faces(files: List[UploadFile] = File(...)):
    if len(files) != 2:
        raise HTTPException(status_code=400, detail="Exactly two files are required for verification.")
    
    return {
        "similarity": 0.85,
        "label": "Mirip sekali",
        "distance": 0.23,
        "confidence": 0.98,
        "image_url_1": None,
        "image_url_2": None
    }
