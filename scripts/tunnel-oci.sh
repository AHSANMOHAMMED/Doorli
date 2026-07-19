#!/usr/bin/env bash
# SSH tunnels so local Node apps can use OCI Docker infra (Postgres/Redis/ES/Minio)
# without Docker Desktop. Leaves tunnels in foreground until Ctrl-C.
set -euo pipefail

OCI_HOST="${OCI_HOST:-140.245.207.93}"
SSH_KEY="${DOORLI_OCI_SSH_KEY:-$HOME/Downloads/ssh-key-2026-07-17.key}"

echo "Opening tunnels to ${OCI_HOST}..."
echo "  localhost:5432  -> postgres"
echo "  localhost:6379  -> redis"
echo "  localhost:9200  -> elasticsearch"
echo "  localhost:9000  -> minio"
echo "  localhost:9092  -> kafka"
echo
echo "Keep this terminal open. Then in another terminal:"
echo "  export DATABASE_URL=postgresql://doorli_user:doorli_password@127.0.0.1:5432/doorli_db?schema=public"
echo "  export REDIS_URL=redis://127.0.0.1:6379"
echo "  npm run start --workspace=@doorli/api"

exec ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new \
  -N \
  -L 5432:127.0.0.1:5432 \
  -L 6379:127.0.0.1:6379 \
  -L 9200:127.0.0.1:9200 \
  -L 9000:127.0.0.1:9000 \
  -L 9001:127.0.0.1:9001 \
  -L 9092:127.0.0.1:9092 \
  "opc@${OCI_HOST}"
