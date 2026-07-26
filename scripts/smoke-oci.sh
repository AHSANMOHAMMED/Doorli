# CI smoke — API health + core routes (run against OCI or localhost)
set -euo pipefail
BASE="${DOORLI_API_BASE:-http://140.245.207.93}"
CURL=(curl -sfS --connect-timeout 5 --max-time 20)

echo "Health…"
"${CURL[@]}" "$BASE/health" | grep -q '"status"'

echo "Vendors…"
"${CURL[@]}" "$BASE/api/v1/vendors" | grep -q '"success":true'

echo "Cities…"
"${CURL[@]}" "$BASE/api/v1/cities" | grep -q '"success":true'

echo "Ride estimate…"
"${CURL[@]}" -X POST "$BASE/api/v1/rides/estimate" \
  -H 'Content-Type: application/json' \
  -d '{"pickupLat":6.93,"pickupLng":79.84,"dropoffLat":6.92,"dropoffLng":79.86}' \
  | grep -qE '"success":true|"totalFare"|\"fare\"'

echo "Login…"
TOKEN=$("${CURL[@]}" -X POST "$BASE/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"customer@doorli.test","password":"Doorli123!"}' \
  | tee /tmp/doorli-smoke-login.json \
  | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
test -n "$TOKEN"

echo "Promo validate…"
"${CURL[@]}" -X POST "$BASE/api/v1/promos/validate" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"code":"WELCOME50","orderAmount":1000}' | grep -q '"success":true'

echo "OK — smoke passed against $BASE"
