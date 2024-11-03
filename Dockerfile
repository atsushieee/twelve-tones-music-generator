# ベースイメージとしてPython 3.9を使用
FROM python:3.9-slim

# システムの依存関係をインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /app

# 必要なパッケージをインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# FastAPIサーバーとクライアントファイルをコピー
COPY . .

# 実行時の環境変数を設定
ENV PORT=7860
ENV WORKERS=1
ENV TIMEOUT=300

# uvicornサーバーを起動（タイムアウトとワーカー数を指定）
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT} --workers ${WORKERS} --timeout-keep-alive ${TIMEOUT}
