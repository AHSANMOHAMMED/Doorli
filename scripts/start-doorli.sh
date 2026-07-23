#!/usr/bin/env bash
# Start Doorli marketplace stack (API + microservices + webs + ERP)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="${HOME}/.npm-global/bin:${PATH}"
mkdir -p /tmp/doorli-logs

set -a
# shellcheck disable=SC1091
[ -f .env ] && . ./.env
set +a

stop_port() {
  local p="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"${p}" -sTCP:LISTEN 2>/dev/null | xargs kill -9 2>/dev/null || true
  else
    fuser -k "${p}/tcp" 2>/dev/null || true
  fi
}

echo "Ensuring Docker infra + ERP database..."
if docker info >/dev/null 2>&1; then
  docker compose up -d >/dev/null
  for _ in $(seq 1 30); do
    if docker exec doorli-postgres pg_isready -U doorli_user >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  bash "$ROOT/scripts/ensure-erp-db.sh"
else
  echo "WARNING: Docker is not running — ERP/API may fail without Postgres/Redis."
fi

echo "Stopping previous Doorli node processes (ports)..."
for p in 4000 4004 4005 4006 4007 8085 8086 3000 3002 3005 3010; do
  stop_port "$p"
done
pkill -f "node dist/index.js" 2>/dev/null || true
pkill -f "node dist/cli.js" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "apps/erp/server.js" 2>/dev/null || true
sleep 1

# Detach from this shell so services keep running after the script exits.
start_ws() {
  local svc="$1"
  shift
  echo "Starting ${svc}..."
  (
    cd "$ROOT"
    if command -v setsid >/dev/null 2>&1; then
      setsid "$@" >"/tmp/doorli-logs/${svc}.log" 2>&1 &
    else
      nohup "$@" >"/tmp/doorli-logs/${svc}.log" 2>&1 </dev/null &
    fi
    echo $! >"/tmp/doorli-logs/${svc}.pid"
  )
}

start_ws api npm run start --workspace=@doorli/api
start_ws search env PORT=4004 npm run start --workspace=@doorli/search
start_ws storage env STORAGE_PORT=4005 npm run start --workspace=@doorli/storage
start_ws ai env AI_PORT=4006 npm run start --workspace=@doorli/ai
start_ws ride env PORT=8085 npm run start --workspace=@doorli/ride-hailing
start_ws delivery env PORT=8086 npm run start --workspace=@doorli/delivery
start_ws notifications npm run start --workspace=@doorli/notifications

# Prefer production start when a Next build exists; otherwise use dev for local.
if [ -f apps/customer-web/.next/BUILD_ID ]; then
  start_ws customer npm run start --workspace=@doorli/customer-web -- -p 3000
else
  start_ws customer npm run dev --workspace=@doorli/customer-web -- -p 3000
fi
if [ -f apps/vendor-web/.next/BUILD_ID ]; then
  start_ws vendor npm run start --workspace=@doorli/vendor-web -- -p 3002
else
  start_ws vendor npm run dev --workspace=@doorli/vendor-web -- -p 3002
fi
if [ -f apps/admin/.next/BUILD_ID ]; then
  start_ws admin npm run start --workspace=@doorli/admin -- -p 3005
else
  start_ws admin npm run dev --workspace=@doorli/admin -- -p 3005
fi

# ERP (Retail Smart) — always start with marketplace stack
if [ ! -f apps/erp/server.js ]; then
  echo "Building ERP server.js..."
  npm run build:server --workspace=@doorli/erp
fi

ERP_DB_URL="${ERP_DATABASE_URL:-postgresql://doorli_user:doorli_password@localhost:5432/doorli_erp}"
echo "Migrating ERP DB..."
(
  cd "$ROOT/apps/erp"
  export DATABASE_URL="$ERP_DB_URL"
  npm run db:migrate >>/tmp/doorli-logs/erp-migrate.log 2>&1 \
    || npm run db:push -- --force >>/tmp/doorli-logs/erp-migrate.log 2>&1 \
    || echo "WARNING: ERP schema sync failed — see /tmp/doorli-logs/erp-migrate.log"
  echo "Seeding ERP DB..."
  npm run db:seed >>/tmp/doorli-logs/erp-seed.log 2>&1 || echo "WARNING: ERP seeding failed"
)

# Root .env points at doorli_db — override so ERP keeps its own DB.
start_ws erp env \
  PORT=3010 \
  NODE_ENV=development \
  SKIP_MIGRATIONS=true \
  DATABASE_URL="$ERP_DB_URL" \
  NEXTAUTH_URL="${ERP_NEXTAUTH_URL:-http://127.0.0.1:3010}" \
  NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-doorli_erp_nextauth_secret_change_me}" \
  ERP_INTERNAL_SECRET="${ERP_INTERNAL_SECRET:-doorli_internal_sync_secret}" \
  npm run start --workspace=@doorli/erp

sleep 10
echo "Health:"
curl -s http://127.0.0.1:4000/health || true
echo
echo "ERP:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3010/ || true
echo "Customer:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/ || true
echo "Logs in /tmp/doorli-logs — sync search:"
curl -s -X POST http://127.0.0.1:4004/api/search/sync || true
echo
echo "Done. URLs: API :4000 | Customer :3000 | Vendor :3002 | Admin :3005 | ERP :3010"
