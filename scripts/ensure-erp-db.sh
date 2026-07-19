#!/usr/bin/env bash
# Create doorli_erp DB if missing (safe on existing Postgres volumes)
set -euo pipefail
docker exec doorli-postgres psql -U doorli_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='doorli_erp'" | grep -q 1 \
  || docker exec doorli-postgres psql -U doorli_user -d postgres -c "CREATE DATABASE doorli_erp OWNER doorli_user;"
echo "doorli_erp ready"
