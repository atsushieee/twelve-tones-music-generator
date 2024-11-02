from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/assets", StaticFiles(directory="assets"), name="assets")
app.mount("/", StaticFiles(directory=".", html=True), name="static")
