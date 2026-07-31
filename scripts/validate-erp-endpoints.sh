#!/bin/bash
# Doorli ERP Endpoint Validation Script
# Validates that ERP endpoints (simple + enterprise) are reachable and configured.

set -euo pipefail

ERP_INTERNAL_SECRET="${ERP_INTERNAL_SECRET:-doorli_internal_sync_secret}"

echo "[erp-validate] Validating ERP endpoints..."

# Validate simple ERP endpoint
echo "[erp-validate] Checking simple ERP (embedded Retail Smart ERP)..."
SIMPLE_RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:3000/api/v1/erp-webhooks/stock-update \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: ${ERP_INTERNAL_SECRET}" \
  -d '{"test": true}' 2>/dev/null || echo "000")

if [ "${SIMPLE_RESP}" = "401" ]; then
  echo "[erp-validate] Simple ERP endpoint reachable (auth check passed)"
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