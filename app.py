from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

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
