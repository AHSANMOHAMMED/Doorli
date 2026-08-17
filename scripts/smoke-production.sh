#!/usr/bin/env bash
set -euo pipefail

MARKETPLACE_URL="${MARKETPLACE_URL:-https://doorli.me}"
ENTERPRISE_URL="${ENTERPRISE_URL:-https://enterprise.doorli.me}"

check() {
  local name="$1" url="$2"
  local headers
  headers="$(curl --fail --silent --show-error --location --max-time 15 -D - -o /dev/null "$url")"
  printf 'PASS %-24s %s\n' "$name" "$url"
  grep -qi '^x-content-type-options: nosniff' <<<"$headers" || { echo "FAIL $name missing security header" >&2; exit 1; }
}

check marketplace-health "$MARKETPLACE_URL/health"
check marketplace-api "$MARKETPLACE_URL/api/v1"
check marketplace-web "$MARKETPLACE_URL/"
check enterprise-web "$ENTERPRISE_URL/"
