#!/usr/bin/env bash
# =============================================================================
# Doorli — DNS & TLS Verification Script
#
# Checks:
#   1. DNS resolution for doorli.me and enterprise.doorli.me
#   2. TLS certificate validity and chain for both domains
#   3. HTTP → HTTPS redirect
#   4. Health endpoints for all Doorli services
#   5. Enterprise OS API reachability
#
# Usage:
#   ./scripts/verify-dns-tls.sh [--skip-tls] [--skip-health]
#
# Environment variables:
#   DOORLI_API_BASE         — overrides the HTTPS base URL
#   ENTERPRISE_HOST         — enterprise ERP hostname (default: enterprise.doorli.me)
#   EXPECTED_OCI_IP         — expected A-record IP (default: 140.245.207.93)
# =============================================================================
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
DOORLI_HOST="${DOORLI_HOST:-doorli.me}"
ENTERPRISE_HOST="${ENTERPRISE_HOST:-enterprise.doorli.me}"
EXPECTED_IP="${EXPECTED_OCI_IP:-140.245.207.93}"
API_BASE="${DOORLI_API_BASE:-https://doorli.me}"
SKIP_TLS=0
SKIP_HEALTH=0

for arg in "$@"; do
  [[ "$arg" == "--skip-tls"    ]] && SKIP_TLS=1
  [[ "$arg" == "--skip-health" ]] && SKIP_HEALTH=1
done

PASS=0
FAIL=0
WARN=0

green()   { printf '\033[0;32m✔  %s\033[0m\n' "$*"; }
red()     { printf '\033[0;31m✘  %s\033[0m\n' "$*"; }
yellow()  { printf '\033[0;33m→  %s\033[0m\n' "$*"; }
warn()    { printf '\033[0;33m⚠  %s\033[0m\n' "$*"; }
section() { printf '\n\033[1;34m══ %s ══\033[0m\n' "$*"; }

ok() {
  green "$1"
  (( PASS++ )) || true
}
fail() {
  red "$1"
  (( FAIL++ )) || true
}
skip() {
  warn "$1"
  (( WARN++ )) || true
}

CURL=(curl -sfS --connect-timeout 10 --max-time 20)
CURL_INSECURE=(curl -sfSk --connect-timeout 10 --max-time 20)

# ── 1. DNS Resolution ─────────────────────────────────────────────────────────
section "1 — DNS Resolution"

check_dns() {
  local host="$1" expected_ip="${2:-}"
  yellow "Resolving $host…"

  if ! command -v dig &>/dev/null && ! command -v nslookup &>/dev/null; then
    skip "Neither dig nor nslookup found — install bind-utils / dnsutils to check DNS"
    return
  fi

  local resolved=""
  if command -v dig &>/dev/null; then
    resolved=$(dig +short "$host" A 2>/dev/null | head -1 || true)
  elif command -v nslookup &>/dev/null; then
    resolved=$(nslookup "$host" 2>/dev/null | grep 'Address:' | tail -1 | awk '{print $2}' || true)
  fi

  if [[ -z "$resolved" ]]; then
    fail "$host — DNS resolution failed (NXDOMAIN or no A record)"
    return
  fi

  yellow "$host resolves to: $resolved"

  if [[ -n "$expected_ip" && "$resolved" != "$expected_ip" ]]; then
    warn "$host resolves to $resolved (expected $expected_ip) — verify your DNS A record"
    (( WARN++ )) || true
  else
    ok "$host → $resolved"
  fi
}

check_dns "$DOORLI_HOST" "$EXPECTED_IP"
check_dns "www.$DOORLI_HOST" "$EXPECTED_IP"
check_dns "$ENTERPRISE_HOST" ""  # enterprise may have a different IP

# ── 2. TLS Certificate Validity ───────────────────────────────────────────────
if (( SKIP_TLS == 0 )); then
  section "2 — TLS Certificate Validity"

  check_tls() {
    local host="$1" port="${2:-443}"
    yellow "Checking TLS for $host:$port…"

    if ! command -v openssl &>/dev/null; then
      skip "openssl not found — cannot check TLS. Install openssl."
      return
    fi

    local cert_info
    cert_info=$(echo | openssl s_client -servername "$host" -connect "$host:$port" \
      -verify_return_error 2>/dev/null </dev/null || true)

    if [[ -z "$cert_info" ]]; then
      fail "$host:$port — TLS connection failed (is HTTPS enabled?)"
      return
    fi

    # Check cert is valid (not expired)
    local expiry
    expiry=$(echo "$cert_info" | openssl x509 -noout -enddate 2>/dev/null \
      | cut -d= -f2 || true)

    if [[ -z "$expiry" ]]; then
      fail "$host — could not read certificate expiry"
      return
    fi

    # Check if cert is expired
    local expiry_epoch
    expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null \
      || date -j -f "%b %d %T %Y %Z" "$expiry" +%s 2>/dev/null || echo "0")
    local now_epoch
    now_epoch=$(date +%s)
    local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

    if (( expiry_epoch < now_epoch )); then
      fail "$host — TLS certificate EXPIRED on $expiry"
    elif (( days_left < 14 )); then
      warn "$host — TLS certificate expires in ${days_left}d ($expiry) — renew soon!"
      (( WARN++ )) || true
      (( PASS++ )) || true
    else
      ok "$host — TLS certificate valid, expires $expiry (${days_left}d)"
    fi

    # Check issuer (Let's Encrypt is expected)
    local issuer
    issuer=$(echo "$cert_info" | openssl x509 -noout -issuer 2>/dev/null | grep -oP 'O = \K[^,]+' || true)
    yellow "  Issuer: ${issuer:-unknown}"

    # Check CN / SAN
    local subject
    subject=$(echo "$cert_info" | openssl x509 -noout -subject 2>/dev/null || true)
    yellow "  Subject: ${subject:-unknown}"
  }

  check_tls "$DOORLI_HOST"
  check_tls "$ENTERPRISE_HOST"
else
  section "2 — TLS Check (skipped)"
  yellow "TLS checks skipped (--skip-tls flag)"
fi

# ── 3. HTTP → HTTPS Redirect ──────────────────────────────────────────────────
section "3 — HTTP → HTTPS Redirect"

check_redirect() {
  local host="$1"
  yellow "Checking HTTP → HTTPS redirect for $host…"

  local resp
  resp=$(curl -sI "http://$host" --connect-timeout 10 --max-time 15 \
    -w "\n%{http_code}" -o /dev/null 2>/dev/null || echo "000")

  # Get actual redirect code
  local code
  code=$(curl -sI "http://$host" --connect-timeout 10 --max-time 15 \
    -w "%{http_code}" -o /dev/null 2>/dev/null || echo "000")

  if [[ "$code" == "301" || "$code" == "302" || "$code" == "308" ]]; then
    ok "$host HTTP→HTTPS redirect (HTTP $code)"
  elif [[ "$code" == "200" ]]; then
    warn "$host HTTP returns 200 (no redirect — configure Nginx to redirect HTTP→HTTPS)"
    (( WARN++ )) || true
  elif [[ "$code" == "000" ]]; then
    fail "$host HTTP — connection refused (port 80 may be closed)"
  else
    warn "$host HTTP returns $code"
    (( WARN++ )) || true
  fi
}

check_redirect "$DOORLI_HOST"

# ── 4. Service Health Endpoints ───────────────────────────────────────────────
if (( SKIP_HEALTH == 0 )); then
  section "4 — Service Health Endpoints"

  check_health() {
    local name="$1" url="$2"
    yellow "Health check: $name → $url"
    local http_code
    http_code=$(curl -s -o /tmp/health-check-resp.json -w "%{http_code}" \
      --connect-timeout 8 --max-time 15 "$url" 2>/dev/null || echo "000")

    local resp_body
    resp_body=$(cat /tmp/health-check-resp.json 2>/dev/null || echo '{}')

    if [[ "$http_code" == "200" ]]; then
      local status_field
      status_field=$(echo "$resp_body" | grep -oP '"status"\s*:\s*"\K[^"]+' | head -1 || echo "ok")
      ok "$name — HTTP 200 (status: $status_field)"
    elif [[ "$http_code" =~ ^[45] ]]; then
      fail "$name — HTTP $http_code at $url"
    elif [[ "$http_code" == "000" ]]; then
      fail "$name — connection refused/timeout at $url"
    else
      warn "$name — HTTP $http_code (unexpected) at $url"
      (( WARN++ )) || true
    fi
  }

  # Main API gateway
  check_health "API Gateway"           "$API_BASE/health"
  check_health "API Gateway (HTTP)"    "http://$DOORLI_HOST/health"

  # Auth service (proxied through gateway or direct)
  check_health "Auth Service"          "$API_BASE/api/v1/auth/health"

  # Core API modules
  check_health "Vendors API"           "$API_BASE/api/v1/vendors"
  check_health "Cities API"            "$API_BASE/api/v1/cities"

  # Delivery service (direct if accessible)
  check_health "Delivery Service"      "${DELIVERY_SERVICE_URL:-http://140.245.207.93:4002}/health"

  # Ride-hailing service
  check_health "Ride-hailing Service"  "${RIDE_SERVICE_URL:-http://140.245.207.93:8085}/health"

  # Search service
  check_health "Search Service"        "${SEARCH_SERVICE_URL:-http://140.245.207.93:4004}/health"

  # Notifications service
  check_health "Notifications Service" "${NOTIFICATIONS_SERVICE_URL:-http://140.245.207.93:4007}/health"

  # Enterprise ERP (Frappe)
  check_health "Enterprise ERP (HTTPS)" "https://$ENTERPRISE_HOST/api/method/frappe.handler.ping"
  check_health "Enterprise ERP (HTTP)"  "http://$ENTERPRISE_HOST/api/method/frappe.handler.ping"

  # Customer and Vendor web apps
  check_health "Customer Web"          "${CUSTOMER_WEB_URL:-https://doorli.me}"
  check_health "Vendor Web"            "${VENDOR_WEB_URL:-https://doorli.me/vendor}"

  rm -f /tmp/health-check-resp.json
else
  section "4 — Health Checks (skipped)"
  yellow "Health checks skipped (--skip-health flag)"
fi

# ── 5. HTTPS Connectivity Test ────────────────────────────────────────────────
section "5 — Full HTTPS Connectivity"

yellow "Testing HTTPS API response from $API_BASE…"
HTTPS_RESP=$("${CURL[@]}" "$API_BASE/health" 2>/dev/null || \
             "${CURL_INSECURE[@]}" "$API_BASE/health" 2>/dev/null || echo '{}')

if echo "$HTTPS_RESP" | grep -q '"status"'; then
  ok "HTTPS API response contains expected status field"
else
  fail "HTTPS API response missing expected content — check Nginx config"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
section "Summary"
TOTAL=$(( PASS + FAIL + WARN ))
echo ""
printf "  Passed   : \033[0;32m%d\033[0m\n" "$PASS"
printf "  Warnings : \033[0;33m%d\033[0m\n" "$WARN"
printf "  Failed   : \033[0;31m%d\033[0m\n" "$FAIL"
echo ""
echo "  Domains checked:"
echo "    $DOORLI_HOST         (expected IP: $EXPECTED_IP)"
echo "    $ENTERPRISE_HOST"
echo ""

if (( FAIL > 0 )); then
  printf '\033[0;31mDNS/TLS/health checks have failures — fix before go-live.\033[0m\n'
  echo ""
  echo "  Common fixes:"
  echo "    DNS:  Update A records in your domain registrar to point to $EXPECTED_IP"
  echo "    TLS:  Run certbot --nginx -d doorli.me -d www.doorli.me -d enterprise.doorli.me"
  echo "    Port: Run ./deploy/oci/open-ingress.sh to open OCI security list ports"
  exit 1
elif (( WARN > 0 )); then
  printf '\033[0;33mAll checks passed with %d warning(s) — review before go-live.\033[0m\n' "$WARN"
else
  printf '\033[0;32mAll DNS, TLS, and health checks passed.\033[0m\n'
fi
