# Updated by GitHub contribution automation.
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data/chromadb /app/data/uploads

# Ensure Python output is not buffered in Docker logs
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
# Default local LLM provider for demo mode
ENV LLM_PROVIDER=fallback
ENV DATABASE_URL=sqlite:///./data/memorygraph.db
ENV CHROMA_DB_PATH=./data/chromadb

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
