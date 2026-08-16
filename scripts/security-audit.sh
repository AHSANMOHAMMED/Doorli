#!/usr/bin/env bash
# Static deployment security audit. Does not print secret values.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENTERPRISE_ROOT="${DOORLI_ENTERPRISE_ROOT:-$ROOT/../Doorli-Enterprise-OS}"
failed=0

check_absent() {
  local pattern="$1" file="$2"
  if grep -Eq "$pattern" "$file"; then
    printf 'FAIL: forbidden security default in %s\n' "$file" >&2
    failed=1
  fi
}

check_absent 'change-me-in-production|doorli_secret|minioadmin|GF_SECURITY_ADMIN_PASSWORD: admin|doorli_password' "$ROOT/docker-compose.yml"
check_absent 'doorli-dev-access-secret|doorli-dev-refresh-secret|doorli_internal_sync_secret' "$ROOT/services/api/src/config/env.ts"
check_absent 'origin: true' "$ROOT/services/api/src/app.ts"
if [ -f "$ENTERPRISE_ROOT/docker-compose.yml" ]; then
  check_absent 'CHANGE_ME|admin_password|root_password' "$ENTERPRISE_ROOT/docker-compose.yml"
fi

if [ "$failed" -ne 0 ]; then
  exit 1
fi
printf 'Security audit passed: no known deployment defaults or wildcard CORS found.\n'
