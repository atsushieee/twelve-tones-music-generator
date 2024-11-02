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
melody_row = []
base_row = []
row_retro = []
row_inverted = []
row_retro_inverted = []
sequence_index = 0

def generate_new_sequence():
    notes = list(range(60, 72))
    random.shuffle(notes)
    return notes

def retrograde(row):
    return row[::-1]

def inversion(row):
    base_note = row[0]
    inverted = [base_note - (note - base_note) for note in row]
    # 音域を60-71に制限
    return [((note - 60) % 12) + 60 for note in inverted]

# 音楽データ生成関数
def generate_music_data(intensity, tempo):
    print(f"Generating music data with intensity: {intensity}, tempo: {tempo}")
    global melody_row, base_row, row_retro, row_inverted, row_retro_inverted, sequence_index
    
    if not melody_row or sequence_index >= len(melody_row):
        if not melody_row or random.random() < 0.25:
            print("!!! generate new sequence !!!")
            base_row = generate_new_sequence()
            row_retro = retrograde(base_row)
            row_inverted = inversion(base_row)
            row_retro_inverted = retrograde(row_inverted)

        melody_row = random.choice([base_row, row_retro, row_inverted, row_retro_inverted])
        sequence_index = 0
    
    note = melody_row[sequence_index]
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
