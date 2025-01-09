from typing import Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from music_generator import MusicGenerator

app = FastAPI()

music_generator = MusicGenerator()
# 各クライアントの状態を保持する辞書
client_states: Dict[str, Dict] = {}

# WebSocket接続を管理するクラス
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
            # クライアントからのメッセージを待機
            data = await websocket.receive_json()
            
            # メッセージタイプに応じた処理
            if data["type"] == "init":
                # クライアントの初期状態を設定
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
                
                # 音符生成
                note_data = music_generator.generate_next_notes(
                    client_id, voice_id, params, global_params, duration
                )
                response = {
                    "type": "note_data",
                    "voiceId": voice_id,
                    "noteData": note_data
                }
            elif data["type"] == "voice_added":
                # 新しい声部の初期化
                voice_id = data["voiceId"]
                music_generator.init_voice_state(client_id, voice_id)
                response = {
                    "type": "voice_added_response",
                    "voiceId": voice_id,
                    "status": "initialized"
                }                
            elif data["type"] == "voice_removed":
                # 声部の状態を削除
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
                # 声部のIDを更新
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

# CORSミドルウェアを追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静的ファイルのマウント
try:
    app.mount("/assets", StaticFiles(directory="assets"), name="assets")
    app.mount("/", StaticFiles(directory=".", html=True), name="static")
except Exception as e:
    print(f"Error mounting static files: {e}")
