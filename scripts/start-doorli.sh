#!/usr/bin/env bash
# Start Doorli marketplace stack (API + microservices + webs + ERP)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
NODE_BIN="${DOORLI_NODE_BIN:-${HOME}/.local/node-v22.23.2-linux-x64/bin}"
if [ -d "$NODE_BIN" ]; then
  export PATH="$NODE_BIN:$PATH"
fi
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

echo "Ensuring infra is reachable (OCI runs bare containers erp-db/core-db/doorli-redis)..."
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  # OCI: infra is managed as standalone containers (erp-db :5432, core-db :5433,
  # doorli-redis :6379). Do NOT run docker compose here — it would fight the
  # running containers and try to pull images (kafka/ES/etc.) that don't exist
  # on OCI. Wait a moment for them to be ready instead.
  for _ in $(seq 1 15); do
    ss -tln 2>/dev/null | grep -qE ":5432 |:6379 " && break
    sleep 1
  done
  echo "Infra ports: $(ss -tln 2>/dev/null | grep -Eo ':(5432|5433|6379) ' | tr -d ' \n:' | tr '\n' ' ' | sed 's/  / /g')"
else
  echo "WARNING: Docker is not running — ERP/API may fail without Postgres/Redis."
fi

echo "Stopping previous Doorli node processes (ports)..."
for p in 4000 4004 4005 4006 4007 4010 8085 8086 3000 3002 3005 3006 3010; do
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
start_ws auth npm run start --workspace=@doorli/auth
start_ws inventory env PORT=4010 npm run start --workspace=@doorli/inventory
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
  start_ws vendor npm run start --workspace=@doorli/vendor-web
else
  start_ws vendor npm run dev --workspace=@doorli/vendor-web -- -p 3002
fi
if [ -f apps/admin/.next/BUILD_ID ]; then
  start_ws admin npm run start --workspace=@doorli/admin -- -p 3005
else
  start_ws admin npm run dev --workspace=@doorli/admin -- -p 3005
fi
if [ -f apps/super-admin/.next/BUILD_ID ]; then
  start_ws super-admin npm run start --workspace=@doorli/super-admin -- -p 3006
else
  start_ws super-admin npm run dev --workspace=@doorli/super-admin -- -p 3006
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
if ! curl -fsS http://127.0.0.1:4010/health/live >/dev/null 2>&1; then
  echo "Inventory did not remain available; restarting it..."
  start_ws inventory env PORT=4010 npm run start --workspace=@doorli/inventory
  sleep 2
fi
echo "Health:"
curl -s http://127.0.0.1:4000/health || true
echo
echo "ERP:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3010/ || true
echo "Super Admin:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3006/super-admin/login || true
echo "Customer:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/ || true
echo "Logs in /tmp/doorli-logs — sync search:"
curl -s -X POST http://127.0.0.1:4004/api/search/sync || true
echo
echo "Done. URLs: API :4000 | Customer :3000 | Vendor :3002 | Admin :3005 | Super Admin :3006 | ERP :3010"
