#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backup}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="${DB_CONTAINER:-drapesoul-db-1}"
UPLOAD_DIR="${UPLOAD_DIR:-./backend/static/uploads}"

mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/images"

echo "[$(date)] Starting backup..."

# PostgreSQL backup
docker exec "$DB_CONTAINER" pg_dump -U drapesoul drapesoul | gzip > "$BACKUP_DIR/db/drapesoul_${TIMESTAMP}.sql.gz"
echo "Database backup: drapesoul_${TIMESTAMP}.sql.gz"

# Image backup
tar -czf "$BACKUP_DIR/images/uploads_${TIMESTAMP}.tar.gz" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")" 2>/dev/null || true
echo "Image backup: uploads_${TIMESTAMP}.tar.gz"

# Optional R2 upload (requires aws cli configured for R2)
if [ -n "${CLOUDFLARE_R2_BUCKET:-}" ] && command -v aws &>/dev/null; then
  aws s3 cp "$BACKUP_DIR/db/drapesoul_${TIMESTAMP}.sql.gz" \
    "s3://${CLOUDFLARE_R2_BUCKET}/backups/db/" \
    --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" || true
  echo "Uploaded DB backup to R2"
fi

# Retention: keep last 14 days
find "$BACKUP_DIR/db" -name "*.sql.gz" -mtime +14 -delete
find "$BACKUP_DIR/images" -name "*.tar.gz" -mtime +14 -delete

echo "[$(date)] Backup complete."
