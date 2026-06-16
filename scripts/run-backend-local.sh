#!/bin/bash
# Local dev runner (no Docker required)
set -eo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Load production secrets from .env, override infra for local
set +u
set -a
source "$ROOT/.env"
set +a
set -u

export DATABASE_URL="postgresql+asyncpg://drapesoul:drapesoul_secret@127.0.0.1:5433/drapesoul"
export REDIS_URL="redis://127.0.0.1:6380/0"
export CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
export BACKEND_URL="http://localhost:8000"
export FRONTEND_URL="http://localhost:5173"
export WEBAPP_URL="http://localhost:5173"
export PUBLIC_MEDIA_URL="http://localhost:8000/static/uploads/products"
export UPLOAD_DIR="$ROOT/backend/static/uploads/products"
export DEBUG=true
export ENV=development

cd "$ROOT/backend"
exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
