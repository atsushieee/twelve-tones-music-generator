from typing import Dict, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from music_generator import MusicGenerator
from pydantic import BaseModel, Field

app = FastAPI()

music_generator = MusicGenerator()
client_states: Dict[str, Dict] = {}

# Manager for WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            
    async def send_note_data(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

manager = ConnectionManager()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# WebSocketエンドポイントを追加
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            # Wait for messages from clients
            data = await websocket.receive_json()
            
            # Process messages based on type
            if data["type"] == "init":
                # Set initial state for client
                client_states[client_id] = {
                    "voice_states": {}
                }
                response = {
                    "type": "init_response",
                    "status": "ready"
                }
            elif data["type"] == "generate_notes":
                voice_id = data["voiceId"]
                params = data["params"]
                duration = data["duration"]
                global_params = data["globalParams"]
                
                # Generate notes
                note_data = music_generator.generate_next_notes(
                    client_id, voice_id, params, global_params, duration
                )
                response = {
                    "type": "note_data",
                    "voiceId": voice_id,
                    "noteData": note_data
                }
            elif data["type"] == "voice_added":
                # Initialize new voice
                voice_id = data["voiceId"]
                music_generator.init_voice_state(client_id, voice_id)
                response = {
                    "type": "voice_added_response",
                    "voiceId": voice_id,
                    "status": "initialized"
                }                
            elif data["type"] == "voice_removed":
                # Remove voice state
                voice_id = data["voiceId"]
                if client_id in music_generator.client_states:
                    if voice_id in music_generator.client_states[client_id]:
                        del music_generator.client_states[client_id][voice_id]
                response = {
                    "type": "voice_removed_response",
                    "voiceId": voice_id,
                    "status": "removed"
                } 
            elif data["type"] == "voice_updated":
                # Update voice ID
                old_id = data["oldId"]
                new_id = data["newId"]
                if client_id in music_generator.client_states:
                    if old_id in music_generator.client_states[client_id]:
                        music_generator.client_states[client_id][new_id] = \
                            music_generator.client_states[client_id].pop(old_id)
                response = {
                    "type": "voice_updated_response",
                    "oldId": old_id,
                    "newId": new_id,
                    "status": "updated"
                }
            else:
                response = {
                    "type": "error",
                    "message": "Unknown message type"
                }
            
            await manager.send_note_data(client_id, response)
            
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        if client_id in client_states:
            del client_states[client_id]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
except Exception as e:
    print(f"Error mounting static files: {e}")


class VolumeFactorUpdate(BaseModel):
    value: float = Field(..., ge=0.5, le=2.0)
    client_id: Optional[str] = Field(None, alias="clientId")

@app.post("/api/volume-factor")
async def update_volume_factor(volume_update: VolumeFactorUpdate):
    print(f"Updating volume factor to {volume_update.value}")

    if volume_update.client_id:
        # send to specific client
        if volume_update.client_id in manager.active_connections:
            await manager.send_note_data(volume_update.client_id, {
                "type": "volume_factor_updated",
                "value": volume_update.value
            })
        else:
            return {"status": "error", "message": "Client not found"}
    else:
        # send to all clients
        for client_id in manager.active_connections:
            print(client_id)
            await manager.send_note_data(client_id, {
                "type": "volume_factor_updated",
                "value": volume_update.value
            })
    
    return {
        "status": "success", 
        "volumeFactor": volume_update.value,
        "target": volume_update.client_id or "all"
    }
