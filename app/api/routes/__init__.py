from fastapi import APIRouter
from api.routes.websocket import router as websocket_router
from api.routes.health import router as health_router
from api.routes.volume import router as volume_router

router = APIRouter()
router.include_router(websocket_router)
router.include_router(health_router)
router.include_router(volume_router)

__all__ = ["router"] 
