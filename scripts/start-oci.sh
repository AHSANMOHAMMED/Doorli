#!/usr/bin/env bash
# Ensure Doorli app processes are running on OCI (Docker infra already remote).
set -euo pipefail
KEY="${DOORLI_OCI_SSH_KEY:-$HOME/Downloads/ssh-key-2026-07-17.key}"
HOST="${OCI_USER:-opc}@${OCI_HOST:-140.245.207.93}"

ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "$HOST" 'bash -s' <<'EOF'
set -euo pipefail
cd ~/Doorli
export PATH="$HOME/.npm-global/bin:$PATH"
mkdir -p /tmp/doorli-logs

# Infra via docker compose on the server
if [ -f docker-compose.yml ]; then
  docker compose up -d
fi

# Ensure ERP DB exists
docker exec doorli-postgres psql -U doorli_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='doorli_erp'" | grep -q 1 \
  || docker exec doorli-postgres psql -U doorli_user -d postgres -c "CREATE DATABASE doorli_erp OWNER doorli_user;"

health() { curl -s -m 3 -o /dev/null -w "%{http_code}" "$1" || echo 000; }

need_start=0
for url in \
  http://127.0.0.1:4000/health \
  http://127.0.0.1:3000/ \
  http://127.0.0.1:3002/vendor \
  http://127.0.0.1:3005/admin \
  http://127.0.0.1:3010/login
do
  code=$(health "$url")
  echo "$code $url"
  if [ "$code" = "000" ] || [ "$code" = "502" ] || [ "$code" = "503" ]; then
    need_start=1
  fi
done

if [ "$need_start" -eq 1 ]; then
  echo "Restarting Doorli processes..."
  bash ~/Doorli/scripts/start-doorli.sh || true
  sleep 8
fi

echo "=== PUBLIC CHECK ==="
curl -s http://127.0.0.1/health; echo
echo "Done. Use http://140.245.207.93/ from your Mac."
EOF
