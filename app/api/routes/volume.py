from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field
from core import connection_manager

router = APIRouter()

class VolumeFactorUpdate(BaseModel):
    value: float = Field(..., ge=0.5, le=2.0)
    client_id: Optional[str] = Field(None, alias="clientId")

@router.post("/api/volume-factor")
async def update_volume_factor(volume_update: VolumeFactorUpdate):
    print(f"Updating volume factor to {volume_update.value}")

    if volume_update.client_id:
        # send to specific client
        if volume_update.client_id in connection_manager.active_connections:
            await connection_manager.send_note_data(volume_update.client_id, {
                "type": "volume_factor_updated",
                "value": volume_update.value
            })
        else:
            return {"status": "error", "message": "Client not found"}
    else:
        # send to all clients
        for client_id in connection_manager.active_connections:
            print(client_id)
            await connection_manager.send_note_data(client_id, {
                "type": "volume_factor_updated",
                "value": volume_update.value
            })
    
    return {
        "status": "success", 
        "volumeFactor": volume_update.value,
        "target": volume_update.client_id or "all"
    }
