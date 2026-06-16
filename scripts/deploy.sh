#!/bin/bash
# Production deployment script for VPS (Ubuntu/Debian)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> DrapeSoul deployment"
echo "    Directory: $ROOT"

if [ ! -f .env ]; then
  echo "ERROR: .env not found. Copy .env.example and configure it first."
  exit 1
fi

# Ensure upload dirs exist
mkdir -p backend/static/uploads/products backend/logs certbot/conf certbot/www scripts/backup

# Build and start all services
echo "==> Building Docker images..."
docker compose build --pull

echo "==> Starting services..."
docker compose up -d

echo "==> Waiting for backend health..."
for i in $(seq 1 30); do
  if docker compose exec -T backend curl -sf http://localhost:8000/api/health >/dev/null 2>&1; then
    echo "    Backend is healthy."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Backend did not become healthy. Check logs:"
    echo "  docker compose logs backend"
    exit 1
  fi
  sleep 3
done

# Seed only if database is empty
PRODUCT_COUNT=$(docker compose exec -T backend python -c "
import asyncio
from sqlalchemy import select, func
from app.db.session import AsyncSessionLocal
from app.models.product import Product
async def count():
    async with AsyncSessionLocal() as db:
        r = await db.execute(select(func.count(Product.id)))
        print(r.scalar() or 0)
asyncio.run(count())
" 2>/dev/null || echo "0")

if [ "${PRODUCT_COUNT:-0}" = "0" ]; then
  echo "==> Seeding sample data (empty database)..."
  docker compose exec -T backend python scripts/seed_data.py || true
else
  echo "==> Database has products, skipping seed."
fi

echo ""
echo "==> Deployment complete!"
echo ""
echo "  Shop:   https://drapesoul.uz"
echo "  Admin:  https://admin.drapesoul.uz/admin/login"
echo "  API:    https://api.drapesoul.uz/api/health"
echo ""
echo "  Logs:   docker compose logs -f"
echo "  Status: docker compose ps"
