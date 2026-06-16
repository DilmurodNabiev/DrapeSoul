#!/bin/bash
# Run from local machine — uploads project and deploys to VPS
set -euo pipefail

VPS_IP="${VPS_IP:?Set VPS_IP}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
VPS_PASS="${VPS_PASS:?Set VPS_PASS}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

export SSHPASS="$VPS_PASS"
SSH="sshpass -e ssh -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_IP"
RSYNC="sshpass -e rsync -az --delete -e 'ssh -o StrictHostKeyChecking=no -p $VPS_PORT'"

echo "==> Initializing VPS..."
$SSH "bash -s" < "$ROOT/scripts/vps-init.sh"

echo "==> Uploading project to /opt/drapesoul..."
eval $RSYNC \
  --exclude node_modules \
  --exclude .venv \
  --exclude pgdata \
  --exclude tools \
  --exclude miniconda3 \
  --exclude .local-logs \
  --exclude .local-pids \
  --exclude .git \
  --exclude frontend/dist \
  --exclude 'backend/static/uploads/products/*' \
  "$ROOT/" "$VPS_USER@$VPS_IP:/opt/drapesoul/"

echo "==> Building and starting containers (this may take 5-10 min on 1GB RAM)..."
$SSH "cd /opt/drapesoul && chmod +x scripts/*.sh && COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose build --parallel 2>&1 | tail -20"
$SSH "cd /opt/drapesoul && docker compose up -d"

echo "==> Waiting for backend..."
for i in $(seq 1 40); do
  if $SSH "curl -sf http://localhost/api/health -H 'Host: api.drapesoul.uz'" 2>/dev/null | grep -q healthy; then
    echo "Backend healthy!"
    break
  fi
  if $SSH "docker compose -f /opt/drapesoul/docker-compose.yml exec -T backend curl -sf http://localhost:8000/api/health" 2>/dev/null | grep -q healthy; then
    echo "Backend healthy!"
    break
  fi
  sleep 5
  if [ "$i" -eq 40 ]; then
    echo "WARN: Health check timeout — check logs with: ssh root@$VPS_IP 'cd /opt/drapesoul && docker compose logs'"
  fi
done

$SSH "cd /opt/drapesoul && docker compose ps"
echo "==> Deployment finished!"
