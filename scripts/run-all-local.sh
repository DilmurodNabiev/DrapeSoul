#!/bin/bash
# Start all DrapeSoul services locally (no Docker)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_DIR="$ROOT/.local-pids"
LOG_DIR="$ROOT/.local-logs"
mkdir -p "$PID_DIR" "$LOG_DIR"

export PATH="$ROOT/tools/node/bin:$PATH"
CONDA="$HOME/miniconda3/bin"
PGDATA="$HOME/pgdata/drapesoul"

start_pg() {
  if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "[postgres] Initializing database..."
    mkdir -p "$PGDATA"
    "$CONDA/initdb" -D "$PGDATA" -U drapesoul --auth-local=trust --auth-host=scram-sha-256 -E UTF8
    "$CONDA/pg_ctl" -D "$PGDATA" -o "-p 5433" -l "$PGDATA/logfile" start
    sleep 2
    "$CONDA/createdb" -p 5433 -U drapesoul drapesoul 2>/dev/null || true
    "$CONDA/psql" -p 5433 -U drapesoul -d drapesoul -c "ALTER USER drapesoul PASSWORD 'drapesoul_secret';" 2>/dev/null || true
  elif ! "$CONDA/pg_ctl" -D "$PGDATA" -o "-p 5433" status >/dev/null 2>&1; then
    echo "[postgres] Starting on port 5433..."
    "$CONDA/pg_ctl" -D "$PGDATA" -o "-p 5433" -l "$PGDATA/logfile" start
    sleep 2
  else
    echo "[postgres] Already running on port 5433"
  fi
}

start_redis() {
  if "$CONDA/redis-cli" -p 6380 ping >/dev/null 2>&1; then
    echo "[redis] Already running on port 6380"
  else
    mkdir -p "$HOME/redis-data"
    echo "[redis] Starting on port 6380..."
    "$CONDA/redis-server" --daemonize yes --port 6380 --dir "$HOME/redis-data" --logfile "$HOME/redis-data/redis.log"
    sleep 1
  fi
}

load_env() {
  set +u
  set -a
  # shellcheck source=/dev/null
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
}

start_backend() {
  if curl -sf http://localhost:8000/api/health >/dev/null 2>&1; then
    echo "[backend] Already running on http://localhost:8000"
    return
  fi
  echo "[backend] Starting API on http://localhost:8000..."
  cd "$ROOT/backend"
  if [ ! -d .venv ]; then
    python3 -m venv .venv
    .venv/bin/pip install -q fastapi uvicorn sqlalchemy asyncpg alembic pydantic pydantic-settings \
      python-jose passlib bcrypt python-multipart aiofiles httpx redis slowapi pillow boto3 aiogram greenlet
  fi
  .venv/bin/alembic upgrade head 2>/dev/null || .venv/bin/alembic upgrade head
  PYTHONPATH=. .venv/bin/python scripts/seed_data.py 2>/dev/null || true
  nohup .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload \
    > "$LOG_DIR/backend.log" 2>&1 &
  echo $! > "$PID_DIR/backend.pid"
  for i in $(seq 1 20); do
    curl -sf http://localhost:8000/api/health >/dev/null 2>&1 && break
    sleep 1
  done
}

start_frontend() {
  if curl -sf http://localhost:5173/ >/dev/null 2>&1; then
    echo "[frontend] Already running on http://localhost:5173"
    return
  fi
  echo "[frontend] Starting on http://localhost:5173..."
  cd "$ROOT/frontend"
  [ -d node_modules ] || npm install --silent
  nohup env VITE_API_URL=http://localhost:8000 npm run dev -- --host 0.0.0.0 --port 5173 \
    > "$LOG_DIR/frontend.log" 2>&1 &
  echo $! > "$PID_DIR/frontend.pid"
  for i in $(seq 1 15); do
    curl -sf http://localhost:5173/ >/dev/null 2>&1 && break
    sleep 1
  done
}

start_bot() {
  if pgrep -f "python.*bot.main" >/dev/null 2>&1; then
    echo "[telegram-bot] Already running"
    return
  fi
  echo "[telegram-bot] Starting..."
  cd "$ROOT/telegram-bot"
  if [ ! -d .venv ]; then
    python3 -m venv .venv
    .venv/bin/pip install -q aiogram pydantic-settings httpx
  fi
  nohup .venv/bin/python -m bot.main > "$LOG_DIR/telegram-bot.log" 2>&1 &
  echo $! > "$PID_DIR/telegram-bot.pid"
}

echo "========================================"
echo "  DrapeSoul — Local Dev Stack"
echo "========================================"

start_pg
start_redis
load_env
start_backend
start_frontend
start_bot

echo ""
echo "  Shop:    http://localhost:5173"
echo "  Admin:   http://localhost:5173/admin/login"
echo "  API:     http://localhost:8000/api/health"
echo "  Docs:    http://localhost:8000/api/docs"
echo ""
echo "  Login:   owner / drapesoul_2024"
echo ""
echo "  Logs:    $LOG_DIR/"
echo "  Stop:    $ROOT/scripts/stop-all-local.sh"
echo "========================================"
