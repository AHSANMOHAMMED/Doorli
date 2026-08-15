#!/usr/bin/env bash
# =============================================================================
# Doorli — OCI Security List: Open Ingress Rules for TCP 80 and 443
#
# This script adds ingress rules for HTTP (80) and HTTPS (443) to the
# Doorli OCI security list using the OCI CLI.
#
# Usage:
#   ./deploy/oci/open-ingress.sh
#
# Prerequisites:
#   - OCI CLI installed and configured (~/.oci/config)
#   - SECURITY_LIST_OCID exported, or set here manually
#   - Sufficient OCI IAM permissions (manage virtual-network-family)
#
# If OCI CLI is not configured, the script prints manual instructions.
# =============================================================================
set -euo pipefail

green()  { printf '\033[0;32m✔  %s\033[0m\n' "$*"; }
red()    { printf '\033[0;31m✘  %s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m→  %s\033[0m\n' "$*"; }
section(){ printf '\n\033[1;34m══ %s ══\033[0m\n' "$*"; }

# ── Check OCI CLI ─────────────────────────────────────────────────────────────
section "Pre-flight: OCI CLI"

if ! command -v oci &>/dev/null; then
  red "OCI CLI not found."
  echo ""
  echo "  Install OCI CLI:"
  echo "    macOS:   brew install oci-cli"
  echo "    Linux:   bash -c \"\$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)\""
  echo "    Windows: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm"
  echo ""
  echo "  After install, configure with:  oci setup config"
  echo ""
  echo "  ─────────────────────────────────────────────────────────────────────"
  echo "  MANUAL ALTERNATIVE (OCI Console):"
  echo "  ─────────────────────────────────────────────────────────────────────"
  echo ""
  echo "  1. Log in to https://cloud.oracle.com"
  echo "  2. Navigate to:  Networking → Virtual Cloud Networks → doorli_vcn"
  echo "  3. Click:  Security Lists → doorli_sl"
  echo "  4. Click:  Add Ingress Rules"
  echo ""
  echo "  Rule 1 — HTTP:"
  echo "    Source CIDR:  0.0.0.0/0"
  echo "    IP Protocol:  TCP"
  echo "    Destination Port Range: 80"
  echo "    Description:  Allow HTTP inbound"
  echo ""
  echo "  Rule 2 — HTTPS:"
  echo "    Source CIDR:  0.0.0.0/0"
  echo "    IP Protocol:  TCP"
  echo "    Destination Port Range: 443"
  echo "    Description:  Allow HTTPS inbound"
  echo ""
  echo "  5. Click Save and verify rules appear in the list."
  echo ""
  exit 0
fi

# Check OCI CLI is configured
if ! oci iam region list --output table &>/dev/null 2>&1; then
  red "OCI CLI is installed but not configured."
  echo ""
  echo "  Run:  oci setup config"
  echo "  Then re-run this script."
  echo ""
  echo "  ─────────────────────────────────────────────────────────────────────"
  echo "  MANUAL ALTERNATIVE:"
  echo "  Open OCI Console → Networking → VCN → doorli_vcn → Security Lists"
  echo "  Add Ingress Rules for TCP 80 and TCP 443 from 0.0.0.0/0"
  echo "  ─────────────────────────────────────────────────────────────────────"
  exit 1
fi

green "OCI CLI configured"

# ── Resolve security list OCID ────────────────────────────────────────────────
section "1 — Resolve Security List OCID"

SECURITY_LIST_OCID="${SECURITY_LIST_OCID:-}"
COMPARTMENT_OCID="${COMPARTMENT_OCID:-}"

if [[ -z "$SECURITY_LIST_OCID" ]]; then
  yellow "SECURITY_LIST_OCID not set — attempting auto-discovery…"

  if [[ -z "$COMPARTMENT_OCID" ]]; then
    # Try to get tenancy from config as fallback compartment
    COMPARTMENT_OCID=$(oci iam compartment list --all 2>/dev/null \
      | grep -oP '"id":\s*"\Kocid1\.compartment[^"]+' | head -1 || true)
    if [[ -z "$COMPARTMENT_OCID" ]]; then
      COMPARTMENT_OCID=$(oci iam compartment list --access-level ACCESSIBLE 2>/dev/null \
        | grep -oP '"id":\s*"\Kocid1[^"]+' | head -1 || true)
    fi
  fi

  if [[ -n "$COMPARTMENT_OCID" ]]; then
    yellow "Using compartment: $COMPARTMENT_OCID"
    SECURITY_LIST_OCID=$(oci network security-list list \
      --compartment-id "$COMPARTMENT_OCID" \
      --all 2>/dev/null \
      | grep -oP '"id":\s*"\Kocid1\.securitylist[^"]+' | head -1 || true)
  fi

  if [[ -z "$SECURITY_LIST_OCID" ]]; then
    red "Could not auto-discover security list OCID."
    echo ""
    echo "  Set SECURITY_LIST_OCID manually:"
    echo "    1. OCI Console → Networking → VCN → doorli_vcn → Security Lists"
    echo "    2. Click doorli_sl → copy the OCID"
    echo "    3. Run:  SECURITY_LIST_OCID=ocid1.securitylist... ./deploy/oci/open-ingress.sh"
    echo ""
    exit 1
  fi
fi

green "Security list OCID: $SECURITY_LIST_OCID"

# ── Fetch current ingress rules ───────────────────────────────────────────────
section "2 — Fetch Current Ingress Rules"
yellow "Reading current security list rules…"

CURRENT_RULES=$(oci network security-list get \
  --security-list-id "$SECURITY_LIST_OCID" \
  --query 'data."ingress-security-rules"' \
  --raw-output 2>/dev/null || echo '[]')

echo "Current ingress rules:"
echo "$CURRENT_RULES" | python3 -c "
import sys, json
rules = json.load(sys.stdin)
for r in rules:
    proto = r.get('protocol','?')
    src = r.get('source','?')
    tcp = r.get('tcp-options',{}) or {}
    ports = tcp.get('destination-port-range',{}) or {}
    min_p = ports.get('min','*')
    max_p = ports.get('max','*')
    print(f'  proto={proto}  src={src}  ports={min_p}-{max_p}')
" 2>/dev/null || echo "  (could not parse — raw: $CURRENT_RULES)"

# ── Check if rules already exist ─────────────────────────────────────────────
HAS_80=$(echo "$CURRENT_RULES" | python3 -c "
import sys, json
rules = json.load(sys.stdin)
for r in rules:
    tcp = r.get('tcp-options',{}) or {}
    ports = (tcp.get('destination-port-range',{}) or {})
    if str(ports.get('min','')) == '80' and r.get('protocol') == '6':
        print('yes'); sys.exit(0)
print('no')
" 2>/dev/null || echo "unknown")

HAS_443=$(echo "$CURRENT_RULES" | python3 -c "
import sys, json
rules = json.load(sys.stdin)
for r in rules:
    tcp = r.get('tcp-options',{}) or {}
    ports = (tcp.get('destination-port-range',{}) or {})
    if str(ports.get('min','')) == '443' and r.get('protocol') == '6':
        print('yes'); sys.exit(0)
print('no')
" 2>/dev/null || echo "unknown")

if [[ "$HAS_80" == "yes" ]]; then
  green "Port 80 ingress rule already exists — no change needed"
fi
if [[ "$HAS_443" == "yes" ]]; then
  green "Port 443 ingress rule already exists — no change needed"
fi

if [[ "$HAS_80" == "yes" && "$HAS_443" == "yes" ]]; then
  echo ""
  green "Both port 80 and 443 ingress rules are already open. Nothing to do."
  exit 0
fi

# ── Build updated rules JSON ───────────────────────────────────────────────────
section "3 — Add Missing Ingress Rules"

# Start with existing rules and append what's missing
NEW_RULES=$(echo "$CURRENT_RULES" | python3 -c "
import sys, json

rules = json.load(sys.stdin)
has_80  = any(
    r.get('protocol') == '6' and
    (r.get('tcp-options',{}) or {}).get('destination-port-range',{}).get('min') == 80
    for r in rules
)
has_443 = any(
    r.get('protocol') == '6' and
    (r.get('tcp-options',{}) or {}).get('destination-port-range',{}).get('min') == 443
    for r in rules
)

if not has_80:
    rules.append({
        'protocol': '6',
        'source': '0.0.0.0/0',
        'source-type': 'CIDR_BLOCK',
        'is-stateless': False,
        'description': 'Allow HTTP inbound for Doorli (Nginx)',
        'tcp-options': {
            'destination-port-range': {'min': 80, 'max': 80}
        }
    })
    print('Added port 80 rule', file=sys.stderr)

if not has_443:
    rules.append({
        'protocol': '6',
        'source': '0.0.0.0/0',
        'source-type': 'CIDR_BLOCK',
        'is-stateless': False,
        'description': 'Allow HTTPS inbound for Doorli (Nginx + TLS)',
        'tcp-options': {
            'destination-port-range': {'min': 443, 'max': 443}
        }
    })
    print('Added port 443 rule', file=sys.stderr)

print(json.dumps(rules))
")

yellow "Applying updated ingress rules to security list…"

oci network security-list update \
  --security-list-id "$SECURITY_LIST_OCID" \
  --ingress-security-rules "$NEW_RULES" \
  --force \
  --wait-for-state AVAILABLE

green "Security list updated successfully."

# ── Verify ────────────────────────────────────────────────────────────────────
section "4 — Verify"
yellow "Confirming updated rules…"

VERIFY=$(oci network security-list get \
  --security-list-id "$SECURITY_LIST_OCID" \
  --query 'data."ingress-security-rules"' \
  --raw-output 2>/dev/null || echo '[]')

FINAL_80=$(echo "$VERIFY" | python3 -c "
import sys, json
rules = json.load(sys.stdin)
for r in rules:
    tcp = r.get('tcp-options',{}) or {}
    ports = (tcp.get('destination-port-range',{}) or {})
    if str(ports.get('min','')) == '80' and r.get('protocol') == '6':
        print('yes'); sys.exit(0)
print('no')
" 2>/dev/null || echo "unknown")

FINAL_443=$(echo "$VERIFY" | python3 -c "
import sys, json
rules = json.load(sys.stdin)
for r in rules:
    tcp = r.get('tcp-options',{}) or {}
    ports = (tcp.get('destination-port-range',{}) or {})
    if str(ports.get('min','')) == '443' and r.get('protocol') == '6':
        print('yes'); sys.exit(0)
print('no')
" 2>/dev/null || echo "unknown")

[[ "$FINAL_80"  == "yes" ]] && green "Port 80  ingress rule: OPEN"  || red "Port 80  ingress rule: MISSING"
[[ "$FINAL_443" == "yes" ]] && green "Port 443 ingress rule: OPEN"  || red "Port 443 ingress rule: MISSING"

echo ""
echo "  ─────────────────────────────────────────────────────────────────────"
echo "  Next steps:"
echo "  1. Ensure Nginx is running on the OCI host and bound to :80 and :443"
echo "  2. Verify:  curl -I http://<OCI_HOST>"
echo "  3. For TLS: run certbot --nginx (Let's Encrypt) or upload your cert"
echo "  4. Test HTTPS:  curl -I https://doorli.me"
echo "  ─────────────────────────────────────────────────────────────────────"
