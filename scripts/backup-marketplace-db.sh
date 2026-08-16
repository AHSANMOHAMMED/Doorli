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
# by the API. Using it avoids assuming container-local Postgres role names.
pg_dump "$DATABASE_URL" | gzip -c > "$OUTPUT"

test -s "$OUTPUT"
sha256sum "$OUTPUT" > "$CHECKSUM"
find "$BACKUP_DIR" -type f -name 'doorli-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'doorli-*.sql.gz.sha256' -mtime "+$RETENTION_DAYS" -delete
printf 'Created %s (%s)\n' "$OUTPUT" "$(du -h "$OUTPUT" | cut -f1)"
printf 'Checksum %s\n' "$CHECKSUM"
