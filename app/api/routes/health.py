from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()} 