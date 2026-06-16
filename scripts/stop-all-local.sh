#!/bin/bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_DIR="$ROOT/.local-pids"
CONDA="$HOME/miniconda3/bin"

for name in backend frontend telegram-bot; do
  if [ -f "$PID_DIR/$name.pid" ]; then
    pid=$(cat "$PID_DIR/$name.pid")
    kill "$pid" 2>/dev/null && echo "Stopped $name (pid $pid)" || true
    rm -f "$PID_DIR/$name.pid"
  fi
done

pkill -f "uvicorn app.main:app" 2>/dev/null && echo "Stopped uvicorn" || true
pkill -f "vite.*5173" 2>/dev/null && echo "Stopped vite" || true
pkill -f "python.*bot.main" 2>/dev/null && echo "Stopped telegram bot" || true

"$CONDA/redis-cli" -p 6380 shutdown 2>/dev/null && echo "Stopped redis" || true
"$CONDA/pg_ctl" -D "$HOME/pgdata/drapesoul" stop 2>/dev/null && echo "Stopped postgres" || true

echo "All local services stopped."
