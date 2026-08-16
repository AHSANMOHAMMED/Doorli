#!/usr/bin/env bash
# Restore a Marketplace PostgreSQL dump. Destructive by design: confirmation is required.
set -euo pipefail

if [ "$#" -ne 1 ]; then
  printf 'Usage: %s /path/to/doorli-*.sql.gz\n' "$0" >&2
  exit 64
fi

DUMP="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -a
[ -f "$ROOT/.env" ] && . "$ROOT/.env"
set +a
: "${DATABASE_URL:?DATABASE_URL must be set}"

test -s "$DUMP"
if [ -f "$DUMP.sha256" ]; then
  sha256sum --check "$DUMP.sha256"
fi

if [ "${CONFIRM_RESTORE:-}" != "YES" ]; then
  printf 'Refusing destructive restore. Set CONFIRM_RESTORE=YES to continue.\n' >&2
  exit 77
fi

printf 'Restoring %s into DATABASE_URL database. Existing data will be replaced.\n' "$DUMP" >&2
gunzip -c "$DUMP" | psql "$DATABASE_URL" --single-transaction --set ON_ERROR_STOP=1
printf 'Marketplace database restore completed.\n'
