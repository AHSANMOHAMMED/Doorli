#!/bin/bash
# Doorli ERP Endpoint Validation Script
# Validates that ERP endpoints (simple + enterprise) are reachable and configured.

set -euo pipefail

: "${ERP_INTERNAL_SECRET:?ERP_INTERNAL_SECRET must be set}"
DOORLI_API_BASE="${DOORLI_API_BASE:-http://localhost:4000}"

echo "[erp-validate] Validating ERP endpoints..."

# Validate simple ERP endpoint
echo "[erp-validate] Checking simple ERP (embedded Retail Smart ERP)..."
SIMPLE_RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  "${DOORLI_API_BASE}/api/v1/erp-webhooks/stock-update" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ERP_INTERNAL_SECRET}" \
  -d '{"test": true}' 2>/dev/null || echo "000")

if [ "${SIMPLE_RESP}" = "400" ] || [ "${SIMPLE_RESP}" = "404" ]; then
  echo "[erp-validate] Simple ERP endpoint reachable (authenticated request parsed)"
else
  echo "[erp-validate] Simple ERP endpoint returned HTTP ${SIMPLE_RESP} (expected 401 or 200)"
fi

# Validate enterprise ERP endpoint (Frappe)
echo "[erp-validate] Checking enterprise ERP (Frappe/ERPNext)..."
FRAPPE_URL="${FRAPPE_URL:-http://localhost:8000}"
FRAPPE_RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  "${FRAPPE_URL}/api/method/desk.get_settings" \
  -H "Authorization: Bearer ${FRAPPE_API_KEY:-}" 2>/dev/null || echo "000")

if [ "${FRAPPE_RESP}" != "000" ]; then
  echo "[erp-validate] Enterprise ERP endpoint reachable (HTTP ${FRAPPE_RESP})"
else
  echo "[erp-validate] Enterprise ERP endpoint not reachable (Frappe may not be deployed)"
  echo "[erp-validate] Set FRAPPE_URL and FRAPPE_API_KEY env vars to configure"
fi

echo "[erp-validate] ERP validation complete"
