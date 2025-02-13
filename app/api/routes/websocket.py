from typing import Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from core import connection_manager
from music_generator import MusicGenerator

router = APIRouter()
music_generator = MusicGenerator()
client_states: Dict[str, Dict] = {}

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await connection_manager.connect(websocket, client_id)
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
            
            await connection_manager.send_note_data(client_id, response)
            
    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)
        if client_id in client_states:
            del client_states[client_id]
