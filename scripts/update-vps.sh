#!/bin/bash
# Update shop on VPS after code changes (keeps database & products)
# Usage: VPS_PASS='yourpassword' ./scripts/update-vps.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$ROOT/scripts/update_vps.py" "$@"
