#!/usr/bin/env bash
set -euo pipefail

wait_for_db() {
  local max_attempts=30
  local attempt=1

  while true; do
    if docker compose exec -T db pg_isready -U user -d doorli >/dev/null 2>&1; then
      return 0
    fi

    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "Database did not become ready in time." >&2
      return 1
    fi

    attempt=$((attempt + 1))
    sleep 2
  done
}

docker compose up -d
wait_for_db
docker compose exec -T api sh -c "cd packages/db && npx prisma migrate deploy"
docker compose exec -T api npm run seed --workspace=@doorli/db
curl -fsS http://localhost:3001/health
