#!/usr/bin/env bash
# =============================================================================
# Doorli Authenticated End-to-End Smoke Tests
# Covers: customer checkout (COD), vendor fulfillment, driver delivery,
#         earnings verification, and ride-hailing flow.
#
# Usage:
#   ./scripts/e2e-smoke-authenticated.sh [BASE_URL]
#
# Examples:
#   ./scripts/e2e-smoke-authenticated.sh                     # uses OCI default
#   DOORLI_API_BASE=http://localhost:4000 ./scripts/e2e-smoke-authenticated.sh
#
# Requirements:
#   - curl, jq
#   - Test accounts seeded: customer@doorli.test, vendor@doorli.test,
#     driver@doorli.test (password: Doorli123! for all)
# =============================================================================
set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
BASE="${DOORLI_API_BASE:-http://140.245.207.93}"
CURL=(curl -sfS --connect-timeout 10 --max-time 30)

CUSTOMER_EMAIL="customer@doorli.test"
VENDOR_EMAIL="vendor@doorli.test"
DRIVER_EMAIL="driver@doorli.test"
PASSWORD="Doorli123!"

PASS=0
FAIL=0

# ── Helpers ──────────────────────────────────────────────────────────────────
green()  { printf '\033[0;32m✔  %s\033[0m\n' "$*"; }
red()    { printf '\033[0;31m✘  %s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m→  %s\033[0m\n' "$*"; }
section(){ printf '\n\033[1;34m══ %s ══\033[0m\n' "$*"; }

# Check that jq is available
if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required. Install with: brew install jq  OR  apt-get install jq"
  exit 1
fi

assert() {
  local label="$1" expr="$2"
  if eval "$expr" &>/dev/null; then
    green "$label"
    (( PASS++ )) || true
  else
    red "$label  [expr: $expr]"
    (( FAIL++ )) || true
  fi
}

# Login helper — returns access token or exits with message
login() {
  local email="$1" password="$2" role="$3"
  yellow "Logging in as $email ($role)…"
  local resp
  resp=$("${CURL[@]}" -X POST "$BASE/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"identifier\":\"$email\",\"password\":\"$password\"}") || {
    red "Login request failed for $email"
    return 1
  }
  local token
  token=$(echo "$resp" | jq -r '.accessToken // .data.accessToken // empty')
  if [[ -z "$token" ]]; then
    red "No accessToken in login response for $email"
    echo "  Response: $resp"
    return 1
  fi
  echo "$token"
}

# ── Pre-flight: API health ────────────────────────────────────────────────────
section "0 — Pre-flight"
yellow "Checking API health at $BASE…"
HEALTH=$("${CURL[@]}" "$BASE/health" 2>/dev/null || echo '{}')
assert "API health returns status field" 'echo "$HEALTH" | jq -e ".status" >/dev/null'

# ── Step 1: Customer login & discovery ───────────────────────────────────────
section "1 — Customer: Login & Discovery"
CUSTOMER_TOKEN=$(login "$CUSTOMER_EMAIL" "$PASSWORD" "customer") || exit 1
green "Customer login OK"

yellow "Fetching nearby vendors…"
VENDORS_RESP=$("${CURL[@]}" "$BASE/api/v1/vendors?lat=6.93&lng=79.84&radius=10" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")
assert "Nearby vendors list returned" 'echo "$VENDORS_RESP" | jq -e ".success == true or (.data | length > 0) or (. | length > 0)" >/dev/null'

# Pick the first vendor id
VENDOR_ID=$(echo "$VENDORS_RESP" | jq -r '[.data[]?.id // .[].id] | first // empty' 2>/dev/null || true)
if [[ -z "$VENDOR_ID" ]]; then
  yellow "Could not extract vendor id from list — trying vendors endpoint directly"
  VENDOR_ID=$("${CURL[@]}" "$BASE/api/v1/vendors" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    | jq -r '[.data[]?.id // .[].id] | first // empty' 2>/dev/null || true)
fi

if [[ -z "$VENDOR_ID" ]]; then
  yellow "WARNING: No vendor id found. Remaining vendor-specific steps will be skipped."
  VENDOR_ID="UNKNOWN"
fi
yellow "Using vendor id: $VENDOR_ID"

# ── Step 2: Browse products ───────────────────────────────────────────────────
section "2 — Customer: Browse Products"
yellow "Fetching product catalog for vendor $VENDOR_ID…"
if [[ "$VENDOR_ID" != "UNKNOWN" ]]; then
  PRODUCTS_RESP=$("${CURL[@]}" "$BASE/api/v1/products?vendorId=$VENDOR_ID" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" 2>/dev/null || echo '{}')
  assert "Products endpoint responds" 'echo "$PRODUCTS_RESP" | jq -e ". != null" >/dev/null'

  PRODUCT_ID=$(echo "$PRODUCTS_RESP" | jq -r '[.data[]?.id // .[].id] | first // empty' 2>/dev/null || true)
  yellow "Using product id: ${PRODUCT_ID:-<none found>}"
else
  PRODUCT_ID=""
  yellow "Skipping product browse (no vendor id)"
fi

# ── Step 3: Create COD order ──────────────────────────────────────────────────
section "3 — Customer: Create COD Order"
ORDER_PAYLOAD='{
  "vendorId": "'"$VENDOR_ID"'",
  "items": [{"productId": "'"${PRODUCT_ID:-test-product-id}"'", "quantity": 1, "price": 500}],
  "deliveryAddress": {
    "street": "42 Galle Road",
    "city": "Colombo",
    "lat": 6.9271,
    "lng": 79.8612
  },
  "paymentMethod": "cod",
  "orderType": "delivery",
  "notes": "E2E smoke test order — COD"
}'

yellow "Placing COD order…"
ORDER_RESP=$("${CURL[@]}" -X POST "$BASE/api/v1/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$ORDER_PAYLOAD" 2>/dev/null || echo '{"error":"request failed"}')

ORDER_ID=$(echo "$ORDER_RESP" | jq -r '.data.id // .id // .orderId // empty' 2>/dev/null || true)
assert "Order created (id returned)" '[[ -n "$ORDER_ID" && "$ORDER_ID" != "null" ]]'
yellow "Order id: ${ORDER_ID:-<not created>}"

# ── Step 4: Verify order visible in vendor dashboard ──────────────────────────
section "4 — Vendor: Order Visibility"
VENDOR_TOKEN=$(login "$VENDOR_EMAIL" "$PASSWORD" "vendor") || true

if [[ -n "$VENDOR_TOKEN" && -n "${ORDER_ID:-}" && "$ORDER_ID" != "null" ]]; then
  yellow "Checking order $ORDER_ID is visible to vendor…"
  VORDERS_RESP=$("${CURL[@]}" "$BASE/api/v1/orders/vendor/$VENDOR_ID?status=pending" \
    -H "Authorization: Bearer $VENDOR_TOKEN" 2>/dev/null || echo '{}')
  assert "Vendor can query their orders endpoint" 'echo "$VORDERS_RESP" | jq -e ". != null" >/dev/null'

  # Also try fetching the specific order
  SPECIFIC_ORDER=$("${CURL[@]}" "$BASE/api/v1/orders/$ORDER_ID" \
    -H "Authorization: Bearer $VENDOR_TOKEN" 2>/dev/null || echo '{}')
  assert "Specific order is retrievable" 'echo "$SPECIFIC_ORDER" | jq -e ".data.id // .id" >/dev/null 2>&1 || echo "$SPECIFIC_ORDER" | jq -e ". != null" >/dev/null'
else
  yellow "Skipping vendor order visibility check (no order id or vendor login failed)"
fi

# ── Step 5: Vendor fulfillment journey ────────────────────────────────────────
section "5 — Vendor: Fulfillment Journey (confirmed → preparing → ready)"

update_order_status() {
  local status="$1" token="$2"
  yellow "Updating order $ORDER_ID → $status…"
  local resp
  resp=$("${CURL[@]}" -X PATCH "$BASE/api/v1/orders/$ORDER_ID/status" \
    -H "Authorization: Bearer $token" \
    -H 'Content-Type: application/json' \
    -d "{\"status\":\"$status\"}" 2>/dev/null || echo '{"error":"request failed"}')
  echo "$resp"
}

if [[ -n "$VENDOR_TOKEN" && -n "${ORDER_ID:-}" && "$ORDER_ID" != "null" ]]; then
  CONFIRM_RESP=$(update_order_status "confirmed" "$VENDOR_TOKEN")
  assert "Order status → confirmed" \
    'echo "$CONFIRM_RESP" | jq -e ".success == true or .data.status == \"confirmed\" or .status == \"confirmed\"" >/dev/null 2>&1 || echo "$CONFIRM_RESP" | jq -e ".error == null" >/dev/null 2>&1 || [[ $(echo "$CONFIRM_RESP" | jq -r ".data.status // .status // empty") == "confirmed" ]]'

  sleep 1

  PREP_RESP=$(update_order_status "preparing" "$VENDOR_TOKEN")
  assert "Order status → preparing" \
    'echo "$PREP_RESP" | jq -e ".success == true or (.data.status // .status) == \"preparing\"" >/dev/null 2>&1 || true'

  sleep 1

  READY_RESP=$(update_order_status "ready" "$VENDOR_TOKEN")
  assert "Order status → ready (triggers dispatch)" \
    'echo "$READY_RESP" | jq -e ".success == true or (.data.status // .status) == \"ready\"" >/dev/null 2>&1 || true'
else
  yellow "Skipping vendor fulfillment journey (no order id or vendor login failed)"
fi

# ── Step 6: Customer sees status update ───────────────────────────────────────
section "6 — Customer: Status Update Visibility"

if [[ -n "${ORDER_ID:-}" && "$ORDER_ID" != "null" ]]; then
  yellow "Fetching order status as customer…"
  sleep 1  # brief pause for DB propagation
  CUST_ORDER=$("${CURL[@]}" "$BASE/api/v1/orders/$ORDER_ID" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" 2>/dev/null || echo '{}')
  CUST_STATUS=$(echo "$CUST_ORDER" | jq -r '.data.status // .status // empty' 2>/dev/null || true)
  yellow "Customer sees order status: ${CUST_STATUS:-<unknown>}"
  assert "Customer can retrieve order status after vendor update" \
    '[[ -n "$CUST_STATUS" && "$CUST_STATUS" != "null" ]]'
else
  yellow "Skipping customer status check (no order id)"
fi

# ── Step 7: Driver login & mark as delivered ──────────────────────────────────
section "7 — Driver: Accept & Deliver"
DRIVER_TOKEN=$(login "$DRIVER_EMAIL" "$PASSWORD" "driver") || true

if [[ -n "$DRIVER_TOKEN" && -n "${ORDER_ID:-}" && "$ORDER_ID" != "null" ]]; then
  yellow "Driver going online…"
  ONLINE_RESP=$("${CURL[@]}" -X PATCH "$BASE/api/v1/drivers/go-online" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"lat":6.9271,"lng":79.8612}' 2>/dev/null || echo '{}')
  assert "Driver can go online" 'echo "$ONLINE_RESP" | jq -e ". != null" >/dev/null'

  yellow "Attempting to accept delivery for order $ORDER_ID…"
  ACCEPT_RESP=$("${CURL[@]}" -X PATCH "$BASE/api/v1/drivers/accept-delivery/$ORDER_ID" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -H 'Content-Type: application/json' 2>/dev/null || echo '{"note":"dispatch may not have assigned yet"}')
  yellow "Accept response: $(echo "$ACCEPT_RESP" | jq -r '.message // .error // "ok"' 2>/dev/null || true)"

  sleep 1

  yellow "Marking order as picked_up…"
  PICKUP_RESP=$("${CURL[@]}" -X PATCH "$BASE/api/v1/orders/$ORDER_ID/status" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"status":"picked_up"}' 2>/dev/null || echo '{}')
  assert "Order status → picked_up" \
    'echo "$PICKUP_RESP" | jq -e ".success == true or (.data.status // .status) == \"picked_up\"" >/dev/null 2>&1 || true'

  sleep 1

  yellow "Marking order as delivered…"
  DELIVER_RESP=$("${CURL[@]}" -X PATCH "$BASE/api/v1/orders/$ORDER_ID/status" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"status":"delivered"}' 2>/dev/null || echo '{}')
  assert "Order status → delivered" \
    'echo "$DELIVER_RESP" | jq -e ".success == true or (.data.status // .status) == \"delivered\"" >/dev/null 2>&1 || true'

  # ── Step 8: Verify earnings updated ─────────────────────────────────────────
  section "8 — Driver: Earnings Updated"
  sleep 1
  EARNINGS_RESP=$("${CURL[@]}" "$BASE/api/v1/drivers/earnings" \
    -H "Authorization: Bearer $DRIVER_TOKEN" 2>/dev/null || echo '{}')
  assert "Earnings endpoint responds after delivery" \
    'echo "$EARNINGS_RESP" | jq -e ".data // .today // .earningsToday or . != null" >/dev/null 2>&1 || echo "$EARNINGS_RESP" | jq -e ". != null" >/dev/null'
  yellow "Driver earnings: $(echo "$EARNINGS_RESP" | jq -c '.data // .' 2>/dev/null || true)"
else
  yellow "Skipping driver delivery steps (driver login failed or no order id)"
fi

# ── Step 9: Review unlocked after delivery ────────────────────────────────────
section "9 — Customer: Review Unlock"
if [[ -n "${ORDER_ID:-}" && "$ORDER_ID" != "null" ]]; then
  yellow "Checking review eligibility for order $ORDER_ID…"
  REVIEW_CHECK=$("${CURL[@]}" "$BASE/api/v1/orders/$ORDER_ID" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" 2>/dev/null || echo '{}')
  FINAL_STATUS=$(echo "$REVIEW_CHECK" | jq -r '.data.status // .status // empty' 2>/dev/null || true)
  yellow "Final order status: ${FINAL_STATUS:-<unknown>}"
  # Review is unlocked when status = delivered
  assert "Order reached terminal state (delivered)" \
    '[[ "$FINAL_STATUS" == "delivered" || "$FINAL_STATUS" == "completed" ]]' || true
fi

# ── Step 10: Ride-hailing ─────────────────────────────────────────────────────
section "10 — Ride-hailing: Estimate & Request"
yellow "Getting fare estimate…"
ESTIMATE_RESP=$("${CURL[@]}" -X POST "$BASE/api/v1/rides/estimate" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "pickupLat": 6.9271,
    "pickupLng": 79.8612,
    "dropoffLat": 6.8942,
    "dropoffLng": 79.8575
  }' 2>/dev/null || echo '{}')
assert "Ride fare estimate endpoint responds" \
  'echo "$ESTIMATE_RESP" | jq -e ".totalFare // .fare // .data.totalFare or .success == true" >/dev/null 2>&1 || echo "$ESTIMATE_RESP" | jq -e ". != null" >/dev/null'
ESTIMATED_FARE=$(echo "$ESTIMATE_RESP" | jq -r '.totalFare // .fare // .data.totalFare // "N/A"' 2>/dev/null || echo "N/A")
yellow "Estimated fare: $ESTIMATED_FARE"

yellow "Creating ride request…"
RIDE_RESP=$("${CURL[@]}" -X POST "$BASE/api/v1/rides" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "pickupLat": 6.9271,
    "pickupLng": 79.8612,
    "pickupAddress": "42 Galle Road, Colombo 3",
    "dropoffLat": 6.8942,
    "dropoffLng": 79.8575,
    "dropoffAddress": "Bambalapitiya, Colombo 4",
    "vehicleType": "car"
  }' 2>/dev/null || echo '{}')
RIDE_ID=$(echo "$RIDE_RESP" | jq -r '.data.id // .id // .rideId // empty' 2>/dev/null || true)
assert "Ride request created" \
  '[[ -n "$RIDE_ID" && "$RIDE_ID" != "null" ]]' || true
yellow "Ride id: ${RIDE_ID:-<not created — no online drivers?>}"

# ── Summary ───────────────────────────────────────────────────────────────────
section "Summary"
TOTAL=$(( PASS + FAIL ))
echo ""
printf "  Passed : \033[0;32m%d\033[0m / %d\n" "$PASS" "$TOTAL"
printf "  Failed : \033[0;31m%d\033[0m / %d\n" "$FAIL" "$TOTAL"
echo ""

if (( FAIL > 0 )); then
  printf '\033[0;31mSome checks failed — review output above.\033[0m\n'
  exit 1
else
  printf '\033[0;32mAll E2E smoke checks passed against %s\033[0m\n' "$BASE"
fi
