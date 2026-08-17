#!/usr/bin/env bash
# Back up the marketplace PostgreSQL database with checksum and retention metadata.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${DOORLI_BACKUP_DIR:-/home/opc/backups/doorli}"
RETENTION_DAYS="${DOORLI_BACKUP_RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT="$BACKUP_DIR/doorli-$STAMP.sql.gz"
CHECKSUM="$OUTPUT.sha256"

mkdir -p "$BACKUP_DIR"

set -a
[ -f "$ROOT/.env" ] && . "$ROOT/.env"
set +a
: "${DATABASE_URL:?DATABASE_URL must be set}"

# DATABASE_URL already contains the host, port, database, and credentials used
# by the API. Prefer the host client, but support OCI where pg_dump is provided
# by the managed Postgres container rather than installed on the host.
if command -v pg_dump >/dev/null 2>&1; then
  pg_dump "$DATABASE_URL" | gzip -c > "$OUTPUT"
elif command -v docker >/dev/null 2>&1 && docker inspect "${DOORLI_PG_DUMP_CONTAINER:-erp-db}" >/dev/null 2>&1; then
  container="${DOORLI_PG_DUMP_CONTAINER:-erp-db}"
  container_url="$(printf '%s' "$DATABASE_URL" | sed -E 's#@[^/:]+:[0-9]+/#@127.0.0.1:5432/#')"
  container_url="${container_url%%\?*}"
  docker exec "$container" pg_dump "$container_url" | gzip -c > "$OUTPUT"
else
  echo 'pg_dump is required (install PostgreSQL client or set DOORLI_PG_DUMP_CONTAINER)' >&2
  exit 127
fi

test -s "$OUTPUT"
sha256sum "$OUTPUT" > "$CHECKSUM"
find "$BACKUP_DIR" -type f -name 'doorli-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'doorli-*.sql.gz.sha256' -mtime "+$RETENTION_DAYS" -delete
printf 'Created %s (%s)\n' "$OUTPUT" "$(du -h "$OUTPUT" | cut -f1)"
printf 'Checksum %s\n' "$CHECKSUM"
