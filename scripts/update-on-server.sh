#!/bin/bash
# Update code ON the VPS directly (SSH into server first, then run this)
set -euo pipefail
cd /opt/drapesoul

echo "==> Pulling latest code..."
# If using git:
if [ -d .git ]; then
  git pull
else
  echo "No git repo — upload code from your PC with: VPS_PASS=... python scripts/update_vps.py"
  exit 1
fi

echo "==> Rebuilding containers..."
docker compose build backend frontend telegram-bot
docker compose up -d --no-deps backend frontend telegram-bot nginx

echo "==> Done!"
docker compose ps
