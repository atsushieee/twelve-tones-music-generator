from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import random

app = FastAPI()

# srcディレクトリを静的ファイルとして提供
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# 音楽生成リクエスト用のリクエストモデル
class EffectRequest(BaseModel):
    intensity: float
    tempo: int

# 音楽データ生成関数
def generate_music_data(intensity: float = 0.5, tempo: int = 120):
    notes = ["C4", "E4", "G4", "B4"]
    duration = "8n"  
    note = random.choice(notes)
    return {
        "note": note,
        "duration": duration,
        "intensity": intensity,
        "tempo": tempo
    }

# 音楽生成エンドポイント
@app.post("/generate_music")
async def generate_music(effect_request: EffectRequest):
    music_data = generate_music_data(effect_request.intensity, effect_request.tempo)
    return music_data

# 静的ファイルとしてindex.htmlを提供
app.mount("/", StaticFiles(directory=".", html=True), name="static")
