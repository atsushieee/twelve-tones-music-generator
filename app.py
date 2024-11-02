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

# 音階の配列を保持するグローバル変数
current_sequence = []
sequence_index = 0

def generate_new_sequence():
    notes = ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4"]
    random.shuffle(notes)
    return notes

# 音楽データ生成関数
def generate_music_data(intensity, tempo):
    print(f"Generating music data with intensity: {intensity}, tempo: {tempo}")
    global current_sequence, sequence_index
    
    # シーケンスが空か最後まで到達した場合、新しいシーケンスを生成
    if not current_sequence or sequence_index >= len(current_sequence):
        current_sequence = generate_new_sequence()
        sequence_index = 0
    
    # 現在の音を取得し、インデックスを進める
    note = current_sequence[sequence_index]
    sequence_index += 1
    
    return {
        "note": note,
        "duration": "4n",
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
