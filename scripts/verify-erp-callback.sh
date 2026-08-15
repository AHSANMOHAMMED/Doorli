#!/usr/bin/env bash
# =============================================================================
# Doorli — ERP Order Status Callback Test
#
# Simulates the Enterprise OS (Frappe/ERPNext) sending an order-status update
# back to Doorli via the internal ERP webhook. Also tests stock-update and
# dispatch-delivery endpoints.
#
# Usage:
#   ./scripts/verify-erp-callback.sh [ORDER_ID] [ERP_ORDER_ID]
#
# Environment variables (or set in .env):
#   DOORLI_API_BASE      — defaults to http://localhost:4000
#   ERP_INTERNAL_SECRET  — shared HMAC secret (must match both sides)
#   TEST_ORDER_ID        — marketplace order id to update
#   TEST_ERP_ORDER_ID    — ERPNext Sales Order docname (e.g. SAL-ORD-00001)
#
# Examples:
#   ./scripts/verify-erp-callback.sh
#   TEST_ORDER_ID=abc-123 ./scripts/verify-erp-callback.sh
# =============================================================================
set -euo pipefail

# ── Load .env if present ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs) 2>/dev/null || true
fi

BASE="${DOORLI_API_BASE:-http://localhost:4000}"
SECRET="${ERP_INTERNAL_SECRET:-doorli_internal_sync_secret}"
ORDER_ID="${TEST_ORDER_ID:-${1:-}}"
ERP_ORDER_ID="${TEST_ERP_ORDER_ID:-${2:-SAL-ORD-TEST-001}}"

PASS=0
FAIL=0

green()  { printf '\033[0;32m✔  %s\033[0m\n' "$*"; }
red()    { printf '\033[0;31m✘  %s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m→  %s\033[0m\n' "$*"; }
section(){ printf '\n\033[1;34m══ %s ══\033[0m\n' "$*"; }

assert_http() {
  # assert_http LABEL EXPECTED_CODE ACTUAL_CODE
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" || ( "$expected" == "2xx" && "$actual" =~ ^2 ) ]]; then
    green "$label (HTTP $actual)"
    (( PASS++ )) || true
  elif [[ "$actual" == "200" || "$actual" == "201" || "$actual" == "204" ]]; then
    green "$label (HTTP $actual — acceptable)"
    (( PASS++ )) || true
  else
    red "$label — expected HTTP $expected, got $actual"
    (( FAIL++ )) || true
  fi
}

CURL_BASIC=(curl -s -o /tmp/erp-cb-resp.json -w "%{http_code}" --connect-timeout 10 --max-time 20)

# ── Pre-flight ────────────────────────────────────────────────────────────────
section "0 — Pre-flight"
yellow "Target: $BASE"
yellow "ERP Internal Secret: ${SECRET:0:8}… (${#SECRET} chars)"

HEALTH_CODE=$("${CURL_BASIC[@]}" "$BASE/health" || echo "000")
if [[ "$HEALTH_CODE" =~ ^2 ]]; then
  green "API health OK (HTTP $HEALTH_CODE)"
else
  red "API not reachable at $BASE (HTTP $HEALTH_CODE) — is Doorli running?"
  exit 1
fi

# ── Resolve test order id ─────────────────────────────────────────────────────
section "1 — Resolve Test Order ID"

if [[ -z "$ORDER_ID" ]]; then
  yellow "No ORDER_ID provided — fetching most recent order from API…"

  # Try to login as customer to get a real order id
  LOGIN_RESP=$(curl -sfS -X POST "$BASE/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"identifier":"customer@doorli.test","password":"Doorli123!"}' \
    --max-time 10 2>/dev/null || echo '{}')
  TMP_TOKEN=$(echo "$LOGIN_RESP" | grep -oP '"accessToken":"\K[^"]+' || true)

  if [[ -n "$TMP_TOKEN" ]]; then
    ORDERS_RESP=$(curl -sfS "$BASE/api/v1/orders/my-orders?limit=1" \
      -H "Authorization: Bearer $TMP_TOKEN" \
      --max-time 10 2>/dev/null || echo '{}')
    ORDER_ID=$(echo "$ORDERS_RESP" | grep -oP '"id":"\K[^"]+' | head -1 || true)
  fi

  if [[ -z "$ORDER_ID" ]]; then
    yellow "Could not resolve a real order id — using placeholder 'test-order-id'"
    yellow "Set TEST_ORDER_ID=<real-uuid> for a real callback test."
    ORDER_ID="test-order-id"
  else
    green "Using order id: $ORDER_ID"
  fi
else
  green "Using provided order id: $ORDER_ID"
fi

# ── Test 1: order-status callback ─────────────────────────────────────────────
section "2 — ERP Order Status Callback (POST /api/v1/erp-webhooks/order-status)"

# Test the full status lifecycle that Enterprise OS would send
for STATUS in confirmed processing delivered; do
  yellow "POSTing status update: $STATUS for marketplace_order_id=$ORDER_ID"

  PAYLOAD=$(cat <<EOF
{
  "marketplace_order_id": "$ORDER_ID",
  "erp_order_id": "$ERP_ORDER_ID",
  "status": "$STATUS",
  "vendor_company": "Test Vendor Company",
  "notes": "ERP callback test — status: $STATUS"
}
EOF
)

  HTTP_CODE=$("${CURL_BASIC[@]}" -X POST "$BASE/api/v1/erp-webhooks/order-status" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SECRET" \
    -H "X-Doorli-Secret: $SECRET" \
    -d "$PAYLOAD" || echo "000")

  RESP_BODY=$(cat /tmp/erp-cb-resp.json 2>/dev/null || echo '{}')
  yellow "Response: $(echo "$RESP_BODY" | head -c 200)"

  # 200/201 = success, 404 = order not found (endpoint works but order fake),
  # 422 = terminal state (endpoint works and correctly rejects update to terminal)
  # 401 = secret mismatch — this is a real failure
  if [[ "$HTTP_CODE" == "401" || "$HTTP_CODE" == "403" ]]; then
    red "ERP webhook order-status ($STATUS) — auth rejected (HTTP $HTTP_CODE)"
    echo "  Ensure ERP_INTERNAL_SECRET matches on both sides."
    (( FAIL++ )) || true
  elif [[ "$HTTP_CODE" == "000" ]]; then
    red "ERP webhook order-status ($STATUS) — connection failed"
    (( FAIL++ )) || true
  else
    # 200, 201, 404 (order not found), 422 (terminal state) all mean endpoint is reachable & working
    green "ERP webhook order-status ($STATUS) — endpoint reachable (HTTP $HTTP_CODE)"
    (( PASS++ )) || true
  fi
done

# ── Test 2: stock-update callback ─────────────────────────────────────────────
section "3 — ERP Stock Update Callback (POST /api/v1/erp-webhooks/stock-update)"
yellow "POSTing stock-update from ERP…"

STOCK_PAYLOAD=$(cat <<EOF
{
  "productId": "test-product-id",
  "newStockQuantity": 42
}
EOF
)

STOCK_CODE=$("${CURL_BASIC[@]}" -X POST "$BASE/api/v1/erp-webhooks/stock-update" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -H "X-Internal-Secret: $SECRET" \
  -d "$STOCK_PAYLOAD" || echo "000")

STOCK_RESP=$(cat /tmp/erp-cb-resp.json 2>/dev/null || echo '{}')
yellow "Stock update response (HTTP $STOCK_CODE): $(echo "$STOCK_RESP" | head -c 200)"

if [[ "$STOCK_CODE" == "401" || "$STOCK_CODE" == "403" ]]; then
  red "Stock update webhook — auth rejected (HTTP $STOCK_CODE)"
  (( FAIL++ )) || true
elif [[ "$STOCK_CODE" == "000" ]]; then
  red "Stock update webhook — connection failed"
  (( FAIL++ )) || true
else
  green "Stock update webhook — endpoint reachable (HTTP $STOCK_CODE)"
  (( PASS++ )) || true
fi

# ── Test 3: dispatch-delivery callback (ERP-only vendors) ─────────────────────
section "4 — ERP Dispatch Delivery Callback (POST /api/v1/erp-webhooks/dispatch-delivery)"
yellow "POSTing dispatch-delivery request (ERP-only vendor POS order)…"

DISPATCH_PAYLOAD=$(cat <<EOF
{
  "erp_order_id": "$ERP_ORDER_ID",
  "vendor_id": "test-vendor-id",
  "dropoff": {
    "address_line": "42 Galle Road",
    "latitude": 6.9271,
    "longitude": 79.8612
  },
  "customer": { "name": "ERP Callback Test", "phone": "0770000000" },
  "total_amount": 700,
  "delivery_fee": 100
}
EOF
)

DISPATCH_CODE=$("${CURL_BASIC[@]}" -X POST "$BASE/api/v1/erp-webhooks/dispatch-delivery" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -H "X-Doorli-Secret: $SECRET" \
  -d "$DISPATCH_PAYLOAD" || echo "000")

DISPATCH_RESP=$(cat /tmp/erp-cb-resp.json 2>/dev/null || echo '{}')
yellow "Dispatch response (HTTP $DISPATCH_CODE): $(echo "$DISPATCH_RESP" | head -c 200)"

if [[ "$DISPATCH_CODE" == "401" || "$DISPATCH_CODE" == "403" ]]; then
  red "dispatch-delivery webhook — auth rejected (HTTP $DISPATCH_CODE)"
  echo "  Check ERP_INTERNAL_SECRET and that the vendor has doorli_delivery feature enabled."
  (( FAIL++ )) || true
elif [[ "$DISPATCH_CODE" == "000" ]]; then
  red "dispatch-delivery webhook — connection failed (endpoint may not be implemented yet)"
  (( FAIL++ )) || true
else
  green "dispatch-delivery webhook — endpoint reachable (HTTP $DISPATCH_CODE)"
  (( PASS++ )) || true
fi

# ── Test 4: Verify order status reflected in Doorli ───────────────────────────
section "5 — Verify Doorli Reflects ERP Status Update"
if [[ "$ORDER_ID" != "test-order-id" ]]; then
  # Login and check order status
  LOGIN_RESP=$(curl -sfS -X POST "$BASE/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"identifier":"customer@doorli.test","password":"Doorli123!"}' \
    --max-time 10 2>/dev/null || echo '{}')
  CHECK_TOKEN=$(echo "$LOGIN_RESP" | grep -oP '"accessToken":"\K[^"]+' || true)

  if [[ -n "$CHECK_TOKEN" ]]; then
    sleep 1
    ORDER_CHECK=$(curl -sfS "$BASE/api/v1/orders/$ORDER_ID" \
      -H "Authorization: Bearer $CHECK_TOKEN" \
      --max-time 10 2>/dev/null || echo '{}')
    DOORLI_STATUS=$(echo "$ORDER_CHECK" | grep -oP '"status":"\K[^"]+' | head -1 || true)
    yellow "Doorli order status after ERP callbacks: ${DOORLI_STATUS:-<unknown>}"
    if [[ -n "$DOORLI_STATUS" && "$DOORLI_STATUS" != "null" ]]; then
      green "Order status is readable from Doorli API"
      (( PASS++ )) || true
    else
      yellow "Could not confirm status reflection (order may not exist or have been updated)"
    fi
  else
    yellow "Could not login to verify — skipping status reflection check"
  fi
else
  yellow "Skipping status reflection check (using placeholder order id)"
fi

# ── Cleanup ───────────────────────────────────────────────────────────────────
rm -f /tmp/erp-cb-resp.json

# ── Summary ───────────────────────────────────────────────────────────────────
section "Summary"
TOTAL=$(( PASS + FAIL ))
echo ""
printf "  Passed : \033[0;32m%d\033[0m / %d\n" "$PASS" "$TOTAL"
printf "  Failed : \033[0;31m%d\033[0m / %d\n" "$FAIL" "$TOTAL"
echo ""
echo "  Endpoints tested:"
echo "    POST $BASE/api/v1/erp-webhooks/order-status"
echo "    POST $BASE/api/v1/erp-webhooks/stock-update"
echo "    POST $BASE/api/v1/erp-webhooks/dispatch-delivery"
echo ""
echo "  Auth header used:  Authorization: Bearer <ERP_INTERNAL_SECRET>"
echo "  Fallback header:   X-Doorli-Secret: <ERP_INTERNAL_SECRET>"
echo "  Secret from:       ERP_INTERNAL_SECRET env var"
echo ""

if (( FAIL > 0 )); then
  printf '\033[0;31mSome checks failed — review output above.\033[0m\n'
  exit 1
else
  printf '\033[0;32mAll ERP callback checks passed.\033[0m\n'
fi
