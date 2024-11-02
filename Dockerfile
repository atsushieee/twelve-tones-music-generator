# ベースイメージとしてPython 3.9を使用
FROM python:3.9-slim

# 作業ディレクトリを設定
WORKDIR /app

# 必要なパッケージをインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# FastAPIサーバーとクライアントファイルをコピー
COPY app.py .
COPY index.html .
COPY assets/ assets/

# uvicornサーバーを起動
# CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]