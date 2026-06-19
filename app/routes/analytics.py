from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/")
async def get_analytics():
    return {
        "status": "success",
        "data": {
            "similarity_distribution": [],
            "roc_curve": [],
            "far_frr": [],
            "age_gap_accuracy": []
        }
    }
