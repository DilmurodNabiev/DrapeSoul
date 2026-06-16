#!/bin/bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./restore.sh <backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
DB_CONTAINER="${DB_CONTAINER:-drapesoul-db-1}"

echo "Restoring database from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U drapesoul -d drapesoul
echo "Restore complete."
