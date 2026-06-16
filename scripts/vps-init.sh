#!/bin/bash
# Wipe old deployments and prepare 1GB VPS — run as root on VPS
set -euo pipefail

echo "==> [1/5] Creating 2GB swap (if missing)..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swap enabled."
else
  swapon /swapfile 2>/dev/null || true
  echo "Swap already exists."
fi

echo "==> [2/6] Stopping all services..."
systemctl stop nginx apache2 2>/dev/null || true
systemctl disable nginx apache2 2>/dev/null || true

echo "==> [3/6] Removing all Docker resources..."
if command -v docker >/dev/null 2>&1; then
  docker compose -f /opt/drapesoul/docker-compose.yml down -v 2>/dev/null || true
  docker stop $(docker ps -aq) 2>/dev/null || true
  docker rm -f $(docker ps -aq) 2>/dev/null || true
  docker system prune -af --volumes 2>/dev/null || true
fi

echo "==> [4/6] Cleaning old files..."
rm -rf /opt/drapesoul /var/www/html/* /root/drapesoul /tmp/drapesoul* 2>/dev/null || true
apt-get clean 2>/dev/null || true

echo "==> [5/6] Installing Docker (if missing)..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

echo "==> [6/6] Configuring firewall..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp 2>/dev/null || true
  ufw allow 80/tcp 2>/dev/null || true
  ufw --force enable 2>/dev/null || true
fi

echo "==> VPS ready for DrapeSoul deployment."
free -h
