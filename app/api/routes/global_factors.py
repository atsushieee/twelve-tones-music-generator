from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field
from core import connection_manager

router = APIRouter()

class FactorConfig:
    def __init__(self, min_value: float, max_value: float, name: str, message_type: str):
        self.min_value = min_value
        self.max_value = max_value
        self.name = name
        self.message_type = message_type

# Define the factors
FACTORS = {
    "volume": FactorConfig(min_value=0.5, max_value=2.0, name="volumeFactor", message_type="volume_factor_updated"),
    "tempo": FactorConfig(min_value=0.5, max_value=2.0, name="tempoFactor", message_type="tempo_factor_updated"),
    # Additional factors can be added here in the future
}

class FactorUpdate(BaseModel):
    value: float
    client_id: Optional[str] = Field(None, alias="clientId")

# Dynamically generate types for each factor
def create_factor_model(factor_name: str):
    config = FACTORS[factor_name]
    
    class FactorModel(FactorUpdate):
        value: float = Field(..., ge=config.min_value, le=config.max_value)
    
    return FactorModel

VolumeFactorUpdate = create_factor_model("volume")
TempoFactorUpdate = create_factor_model("tempo")

async def update_factor(factor_type: str, factor_update: FactorUpdate):
    """
    共通のファクター更新ロジック
    """
    config = FACTORS[factor_type]
    print(f"Updating {factor_type} factor to {factor_update.value}")

    if factor_update.client_id:
        # Send to a specific client
        if factor_update.client_id in connection_manager.active_connections:
            await connection_manager.send_note_data(factor_update.client_id, {
                "type": config.message_type,
                "value": factor_update.value
            })
        else:
            return {"status": "error", "message": "Client not found"}
    else:
        # Send to all clients
        for client_id in connection_manager.active_connections:
            print(client_id)
            await connection_manager.send_note_data(client_id, {
                "type": config.message_type,
                "value": factor_update.value
            })
    
    return {
        "status": "success", 
        config.name: factor_update.value,
        "target": factor_update.client_id or "all"
    }

@router.post("/api/volume-factor")
async def update_volume_factor(volume_update: VolumeFactorUpdate):
    return await update_factor("volume", volume_update)

@router.post("/api/tempo-factor")
async def update_tempo_factor(tempo_update: TempoFactorUpdate):
    return await update_factor("tempo", tempo_update)
