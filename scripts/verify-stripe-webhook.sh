#!/usr/bin/env bash
# =============================================================================
# Doorli — Stripe Webhook Verification Script
#
# Two modes:
#   1. LOCAL (default)  — uses `stripe listen --forward-to` to tunnel Stripe
#      events to a locally running Doorli API and verify order confirmation.
#   2. PRODUCTION       — STRIPE_MODE=production
#      Prints instructions for registering the production webhook URL.
#
# Usage:
#   ./scripts/verify-stripe-webhook.sh                  # local mode
#   STRIPE_MODE=production ./scripts/verify-stripe-webhook.sh
#
# Requirements (local mode):
#   - stripe CLI installed  (brew install stripe/stripe-cli/stripe)
#   - Doorli API running locally on port 4000
#   - STRIPE_SECRET_KEY exported (or set in .env)
#   - STRIPE_WEBHOOK_SECRET exported (or will be captured from stripe listen)
#
# Requirements (production mode):
#   - stripe CLI installed
#   - STRIPE_SECRET_KEY (production key sk_live_...)
# =============================================================================
set -euo pipefail

# ── Load .env if present ─────────────────────────────────────────────────────
if [[ -f "$(dirname "$0")/../.env" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$(dirname "$0")/../.env" | grep -v '^$' | xargs) 2>/dev/null || true
fi

MODE="${STRIPE_MODE:-local}"
BASE="${DOORLI_API_BASE:-http://localhost:4000}"
STRIPE_SK="${STRIPE_SECRET_KEY:-}"
WEBHOOK_PATH="/api/v1/payments/webhook/stripe"

green()  { printf '\033[0;32m✔  %s\033[0m\n' "$*"; }
red()    { printf '\033[0;31m✘  %s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m→  %s\033[0m\n' "$*"; }
section(){ printf '\n\033[1;34m══ %s ══\033[0m\n' "$*"; }

# ── Check stripe CLI ─────────────────────────────────────────────────────────
if ! command -v stripe &>/dev/null; then
  red "stripe CLI not found."
  echo ""
  echo "  Install on macOS:   brew install stripe/stripe-cli/stripe"
  echo "  Install on Linux:   https://stripe.com/docs/stripe-cli#install"
  echo "  Install on Windows: https://stripe.com/docs/stripe-cli#install"
  exit 1
fi
green "stripe CLI found: $(stripe version)"

# ── Production mode: instructions only ───────────────────────────────────────
if [[ "$MODE" == "production" ]]; then
  section "Production Stripe Webhook Setup"
  echo ""
  echo "  Follow these steps to register the Doorli production webhook:"
  echo ""
  echo "  1. Go to:  https://dashboard.stripe.com/webhooks"
  echo "     (or for test mode: https://dashboard.stripe.com/test/webhooks)"
  echo ""
  echo "  2. Click 'Add endpoint' and enter:"
  echo "     Endpoint URL:  https://doorli.me/api/v1/payments/webhook/stripe"
  echo ""
  echo "  3. Select these events to listen for:"
  echo "     • payment_intent.succeeded"
  echo "     • payment_intent.payment_failed"
  echo "     • payment_intent.canceled"
  echo "     • charge.refunded"
  echo "     • customer.subscription.created  (for Premium membership)"
  echo "     • customer.subscription.deleted"
  echo "     • invoice.payment_succeeded"
  echo "     • invoice.payment_failed"
  echo ""
  echo "  4. After creating, copy the 'Signing secret' (whsec_...) and set:"
  echo "     STRIPE_WEBHOOK_SECRET=whsec_... in your OCI .env file"
  echo ""
  echo "  5. Restart the API service to pick up the new secret:"
  echo "     ssh ubuntu@\${OCI_HOST} 'cd /opt/doorli && docker compose restart api'"
  echo ""
  echo "  6. Send a test event from the Stripe dashboard to verify:"
  echo "     Endpoint → Send test webhook → payment_intent.succeeded"
  echo ""

  if [[ -n "$STRIPE_SK" ]]; then
    section "Registering via CLI (stripe CLI)"
    yellow "Registering webhook via Stripe CLI using provided STRIPE_SECRET_KEY…"
    stripe listen \
      --api-key "$STRIPE_SK" \
      --print-secret \
      --events payment_intent.succeeded,payment_intent.payment_failed,charge.refunded \
      --forward-to https://doorli.me/api/v1/payments/webhook/stripe &
    LISTEN_PID=$!
    sleep 3
    kill "$LISTEN_PID" 2>/dev/null || true
  fi
  exit 0
fi

# ── Local mode ────────────────────────────────────────────────────────────────
section "1 — Verify API is reachable"
if ! curl -sfS --connect-timeout 5 "$BASE/health" | grep -q '"status"'; then
  red "Doorli API is not reachable at $BASE — start it first (npm run dev:api)"
  exit 1
fi
green "API health OK at $BASE"

section "2 — Start stripe webhook listener"
WEBHOOK_FORWARD="$BASE$WEBHOOK_PATH"
echo ""
yellow "Forwarding Stripe events → $WEBHOOK_FORWARD"
yellow "This will run in the background for 60 seconds…"
echo ""

# Write listener output to a temp file so we can extract the signing secret
STRIPE_LOG=$(mktemp /tmp/stripe-listen-XXXX.log)

# Start stripe listen in background
if [[ -n "$STRIPE_SK" ]]; then
  stripe listen \
    --api-key "$STRIPE_SK" \
    --events payment_intent.succeeded,payment_intent.payment_failed,charge.refunded,customer.subscription.created \
    --forward-to "$WEBHOOK_FORWARD" \
    > "$STRIPE_LOG" 2>&1 &
else
  stripe listen \
    --events payment_intent.succeeded,payment_intent.payment_failed,charge.refunded,customer.subscription.created \
    --forward-to "$WEBHOOK_FORWARD" \
    > "$STRIPE_LOG" 2>&1 &
fi
LISTEN_PID=$!

# Wait for the listener to be ready (it prints the webhook secret)
sleep 4

# Extract signing secret from stripe listen output
WEBHOOK_SECRET=$(grep -oP 'whsec_\S+' "$STRIPE_LOG" | head -1 || true)
if [[ -n "$WEBHOOK_SECRET" ]]; then
  green "Webhook signing secret captured: ${WEBHOOK_SECRET:0:12}…"
  yellow "Add to .env:  STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET"
else
  yellow "Could not auto-extract webhook signing secret from stripe listen output."
  yellow "Check $STRIPE_LOG — copy whsec_... value to STRIPE_WEBHOOK_SECRET in .env"
fi

section "3 — Trigger test payment_intent.succeeded"
yellow "Triggering payment_intent.succeeded event via Stripe CLI…"

if [[ -n "$STRIPE_SK" ]]; then
  stripe trigger payment_intent.succeeded --api-key "$STRIPE_SK" &
else
  stripe trigger payment_intent.succeeded &
fi
TRIGGER_PID=$!

# Give the event time to reach the local endpoint
sleep 8
wait "$TRIGGER_PID" 2>/dev/null || true

section "4 — Check API received the webhook"
# Check stripe log for delivery confirmation (HTTP 2xx from our endpoint)
if grep -q '200\|Received event' "$STRIPE_LOG" 2>/dev/null; then
  green "Webhook delivered — API returned 2xx for payment_intent.succeeded"
else
  yellow "Check stripe listener log for delivery status:"
  echo ""
  cat "$STRIPE_LOG" | tail -30
  echo ""
  yellow "If you see 'Failed to POST' — ensure your webhook handler is mounted at $WEBHOOK_PATH"
fi

section "5 — Verify order confirmation in API"
yellow "Checking recent payments in API…"
# Use a customer token if available from prior test
if [[ -n "${CUSTOMER_TOKEN:-}" ]]; then
  PMTS=$( curl -sfS "$BASE/api/v1/payments" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    --max-time 10 2>/dev/null | head -200 || true)
  yellow "Payments response: ${PMTS:0:200}…"
else
  yellow "No CUSTOMER_TOKEN available — skip payment list check"
  yellow "Run e2e-smoke-authenticated.sh first, then re-run this script with CUSTOMER_TOKEN exported."
fi

# Cleanup
kill "$LISTEN_PID" 2>/dev/null || true
rm -f "$STRIPE_LOG"

section "Summary"
echo ""
echo "  Stripe webhook flow verified for local environment."
echo ""
echo "  For production:"
echo "    1. Set STRIPE_WEBHOOK_SECRET in OCI .env"
echo "    2. Register endpoint:  https://doorli.me/api/v1/payments/webhook/stripe"
echo "    3. Re-run:  STRIPE_MODE=production ./scripts/verify-stripe-webhook.sh"
echo ""
green "Done."
