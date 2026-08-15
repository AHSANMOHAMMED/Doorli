# Doorli Production Readiness Checklist

Last updated: August 2026
Covers: Tasks 3 – 6 (Deployment Gate, Smoke Tests, DNS/TLS, Monitoring, Backups)

---

## How to use this checklist

Work top-to-bottom. Each section maps to a task group in the implementation plan.
Mark items ✅ as you complete them. Do **not** proceed to the next section until all blocking items in the current section are ✅.

---

## Section 1 — OCI Infrastructure & Ingress Rules (Task 5.1)

### 1.1 Security List Ports

Run the automated helper first:

```bash
./deploy/oci/open-ingress.sh
```

| # | Check | Command / Location | Status |
|---|-------|--------------------|--------|
| 1.1 | TCP 80 ingress rule open | `open-ingress.sh` or OCI Console → Networking → VCN → doorli_sl | ☐ |
| 1.2 | TCP 443 ingress rule open | `open-ingress.sh` or OCI Console | ☐ |
| 1.3 | TCP 22 (SSH) ingress rule open | Pre-existing — verify not removed | ☐ |
| 1.4 | All other required service ports open (4000–4002, 4004, 4006–4007, 8085–8089) | OCI Console — add as needed | ☐ |

### 1.2 Nginx on OCI Host

```bash
# On OCI host:
sudo nginx -t           # Test config
sudo systemctl status nginx
curl -I http://localhost
```

| # | Check | Status |
|---|-------|--------|
| 1.5 | Nginx installed and running on OCI host | ☐ |
| 1.6 | Nginx proxies `/` to customer web (:3000) | ☐ |
| 1.7 | Nginx proxies `/api/` to API gateway (:4000) | ☐ |
| 1.8 | Nginx proxies `/vendor/` to vendor web (:3002) | ☐ |
| 1.9 | Nginx proxies `/admin/` to super-admin (:3005) | ☐ |
| 1.10 | HTTP (port 80) redirects to HTTPS (301) | ☐ |

---

## Section 2 — DNS Configuration (Task 5.2)

Run the verification script after updating DNS records:

```bash
./scripts/verify-dns-tls.sh
```

### 2.1 DNS A Records

All records must point to the OCI public IP: **140.245.207.93**
(Confirm current IP: `curl http://checkip.amazonaws.com` on OCI host)

| Domain | Record Type | Expected Value | Status |
|--------|-------------|----------------|--------|
| `doorli.me` | A | `140.245.207.93` | ☐ |
| `www.doorli.me` | A or CNAME | `140.245.207.93` | ☐ |
| `enterprise.doorli.me` | A | Enterprise OS host IP | ☐ |
| `api.doorli.me` | A or CNAME | `140.245.207.93` (optional, for direct API access) | ☐ |

### 2.2 TLS / SSL Certificates

```bash
# On OCI host — install certbot if not present:
sudo apt-get install -y certbot python3-certbot-nginx

# Issue certificate for all Doorli domains:
sudo certbot --nginx \
  -d doorli.me \
  -d www.doorli.me \
  --email admin@doorli.me \
  --agree-tos \
  --non-interactive

# Enterprise OS (run on Enterprise OS host):
sudo certbot --nginx \
  -d enterprise.doorli.me \
  --email admin@doorli.me \
  --agree-tos \
  --non-interactive
```

| # | Check | Status |
|---|-------|--------|
| 2.1 | `doorli.me` TLS cert issued and valid | ☐ |
| 2.2 | `www.doorli.me` TLS cert issued and valid | ☐ |
| 2.3 | `enterprise.doorli.me` TLS cert issued and valid | ☐ |
| 2.4 | Auto-renewal configured (`certbot renew --dry-run` succeeds) | ☐ |
| 2.5 | `verify-dns-tls.sh` reports all green | ☐ |

---

## Section 3 — Stripe Webhook Setup (Task 5.4)

### 3.1 Stripe Dashboard Configuration

1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
   (test: [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks))
2. Click **Add endpoint**
3. Set URL to: `https://doorli.me/api/v1/payments/webhook/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Save and copy the **Signing secret** (`whsec_...`)

### 3.2 Environment Variables

```bash
# Add to OCI .env:
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=lkr

# Restart API:
ssh ubuntu@$OCI_HOST 'cd /opt/doorli && docker compose restart api'
```

### 3.3 Verification

```bash
# Test local webhook forwarding:
./scripts/verify-stripe-webhook.sh

# Test production endpoint (after DNS/TLS is live):
STRIPE_MODE=production ./scripts/verify-stripe-webhook.sh

# Send test event from Stripe dashboard:
# Dashboard → Webhooks → your endpoint → Send test webhook → payment_intent.succeeded
```

| # | Check | Status |
|---|-------|--------|
| 3.1 | Stripe webhook endpoint registered in dashboard | ☐ |
| 3.2 | `STRIPE_WEBHOOK_SECRET` set in OCI `.env` | ☐ |
| 3.3 | `STRIPE_SECRET_KEY` (production `sk_live_…`) set in OCI `.env` | ☐ |
| 3.4 | Test event from Stripe dashboard returns HTTP 200 | ☐ |
| 3.5 | `payment_intent.succeeded` triggers order confirmation in DB | ☐ |
| 3.6 | PayHere webhook (`/api/v1/payments/webhook/payhere`) also tested | ☐ |

---

## Section 4 — ERP Integration Verification (Task 5.3)

### 4.1 Enterprise OS Environment

```bash
# On Enterprise OS host (.env):
DOORLI_WEBHOOK_SECRET=<same as Doorli ERP_INTERNAL_SECRET>
DOORLI_MARKETPLACE_ORDER_STATUS_URL=https://doorli.me/api/v1/erp-webhooks/order-status
```

### 4.2 ERP Callback Tests

```bash
# Two-way callback test:
DOORLI_API_BASE=https://doorli.me ./scripts/verify-erp-callback.sh

# Or with a specific order:
TEST_ORDER_ID=<real-order-uuid> ./scripts/verify-erp-callback.sh
```

| # | Check | Command | Status |
|---|-------|---------|--------|
| 4.1 | `ERP_INTERNAL_SECRET` matches `DOORLI_WEBHOOK_SECRET` on Enterprise OS | Compare values in both `.env` files | ☐ |
| 4.2 | `POST /api/v1/erp-webhooks/order-status` returns 200 with valid secret | `verify-erp-callback.sh` | ☐ |
| 4.3 | `POST /api/v1/erp-webhooks/stock-update` returns 200 with valid secret | `verify-erp-callback.sh` | ☐ |
| 4.4 | Enterprise OS can POST order-status to Doorli (reverse direction test) | SSH to Enterprise OS; curl Doorli endpoint | ☐ |
| 4.5 | Order status reflected in Doorli after ERP callback | `verify-erp-callback.sh` step 5 | ☐ |
| 4.6 | ERP provision endpoint reachable: `https://enterprise.doorli.me/api/method/doorli_core.api.provision_vendor` | `curl -I` or script | ☐ |

---

## Section 5 — Authenticated E2E Smoke Tests (Tasks 4.1 – 4.5)

Run the full E2E smoke test suite against production:

```bash
DOORLI_API_BASE=https://doorli.me ./scripts/e2e-smoke-authenticated.sh
```

### 5.1 Test Credentials Required

Seed or verify these test accounts exist in the production database:

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Customer | `customer@doorli.test` | `Doorli123!` | customer |
| Vendor | `vendor@doorli.test` | `Doorli123!` | vendor |
| Driver | `driver@doorli.test` | `Doorli123!` | driver |

```bash
# Seed via API or directly in DB:
curl -X POST https://doorli.me/api/v1/admin/seed-test-accounts \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
# Or via Prisma:
# cd packages/db && npx prisma db seed
```

### 5.2 Smoke Test Checklist

| # | Journey | Script | Status |
|---|---------|--------|--------|
| 5.1 | Customer login (email/password) | `e2e-smoke-authenticated.sh` step 1 | ☐ |
| 5.2 | Browse vendors (nearby API) | `e2e-smoke-authenticated.sh` step 2 | ☐ |
| 5.3 | Browse products for a vendor | `e2e-smoke-authenticated.sh` step 3 | ☐ |
| 5.4 | Place COD order | `e2e-smoke-authenticated.sh` step 4 | ☐ |
| 5.5 | Vendor sees order in dashboard | `e2e-smoke-authenticated.sh` step 5 | ☐ |
| 5.6 | Vendor: confirmed → preparing → ready | `e2e-smoke-authenticated.sh` step 6 | ☐ |
| 5.7 | Customer sees status update | `e2e-smoke-authenticated.sh` step 7 | ☐ |
| 5.8 | Driver goes online | `e2e-smoke-authenticated.sh` step 8 | ☐ |
| 5.9 | Driver picks up and delivers | `e2e-smoke-authenticated.sh` step 8 | ☐ |
| 5.10 | Driver earnings updated | `e2e-smoke-authenticated.sh` step 9 | ☐ |
| 5.11 | Customer review unlocked after delivery | `e2e-smoke-authenticated.sh` step 10 | ☐ |
| 5.12 | Ride fare estimate returned | `e2e-smoke-authenticated.sh` step 11 | ☐ |
| 5.13 | Ride request created | `e2e-smoke-authenticated.sh` step 11 | ☐ |
| 5.14 | Stripe sandbox payment (PaymentIntent → webhook → order confirmed) | `verify-stripe-webhook.sh` | ☐ |
| 5.15 | Super Admin: toggle vendor ERP entitlement | Manual via Super Admin panel | ☐ |

---

## Section 6 — Monitoring, Backups & Alerting (Task 6)

### 6.1 Prometheus + Grafana (Task 6.1)

```bash
# On OCI host — add to docker-compose.prod.yml:
# prometheus:
#   image: prom/prometheus:v2.51
#   volumes: [./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml]
#   ports: ['9090:9090']
# grafana:
#   image: grafana/grafana:10.4
#   ports: ['3030:3000']
#   environment: [GF_SECURITY_ADMIN_PASSWORD=<CHANGE_ME>]
```

Key dashboards to configure in Grafana:
- API p95 latency (target < 200ms)
- Order volume per minute
- Error rate by service
- Active WebSocket connections
- Redis hit rate
- DB connection pool usage

| # | Check | Status |
|---|-------|--------|
| 6.1 | Prometheus scraping API `/metrics` endpoint | ☐ |
| 6.2 | Grafana dashboard: API latency, error rate, order volume | ☐ |
| 6.3 | Grafana dashboard: Redis and DB health | ☐ |
| 6.4 | Alert rule: API health check failure > 1 min → notify | ☐ |

### 6.2 PostgreSQL Backups (Task 6.2)

```bash
# Automated daily backup cron (add to crontab on OCI host):
# 0 2 * * * /opt/doorli/scripts/backup-db.sh >> /var/log/doorli-backup.log 2>&1

# Manual backup:
docker exec doorli-db-1 pg_dump -U doorli_user doorli_db \
  | gzip > /backups/doorli-$(date +%Y%m%d).sql.gz

# Verify backup is restorable:
gunzip -c /backups/doorli-<date>.sql.gz | wc -l   # should be > 1000 lines
```

| # | Check | Status |
|---|-------|--------|
| 6.5 | Daily automated DB backup configured (cron or OCI backup policy) | ☐ |
| 6.6 | Backups uploaded to OCI Object Storage or S3 | ☐ |
| 6.7 | Backup retention: minimum 30 days | ☐ |
| 6.8 | Restore test: successfully restored from a recent backup | ☐ |
| 6.9 | Backup failure alert configured (email or Slack) | ☐ |

### 6.3 PagerDuty / Uptime Alerting (Task 6.3)

```bash
# Configure uptime monitoring (UptimeRobot or Freshping — free tier):
# Monitor URL: https://doorli.me/health
# Check interval: 1 minute
# Alert: email + webhook to Slack/PagerDuty on failure
```

| # | Check | Status |
|---|-------|--------|
| 6.10 | Uptime monitor configured for `https://doorli.me/health` | ☐ |
| 6.11 | Uptime monitor configured for `https://enterprise.doorli.me` | ☐ |
| 6.12 | On-call escalation policy configured in PagerDuty (or equivalent) | ☐ |
| 6.13 | Slack/email alert tested (trigger manually, confirm receipt) | ☐ |

### 6.4 Sentry Error Tracking (Task 6.4)

```bash
# Add to each service .env (or OCI .env):
SENTRY_DSN=https://...@sentry.io/<project-id>

# Restart all services:
ssh ubuntu@$OCI_HOST 'cd /opt/doorli && docker compose restart'
```

| # | Check | Status |
|---|-------|--------|
| 6.14 | `SENTRY_DSN` set for `services/api` | ☐ |
| 6.15 | `SENTRY_DSN` set for `services/delivery` | ☐ |
| 6.16 | `SENTRY_DSN` set for `services/auth` | ☐ |
| 6.17 | `SENTRY_DSN` set for `apps/customer-web` | ☐ |
| 6.18 | `SENTRY_DSN` set for `apps/vendor-web` | ☐ |
| 6.19 | Test error event appears in Sentry dashboard | ☐ |

---

## Section 7 — Credentials Final Checklist

All secrets must be set in `/opt/doorli/.env` on the OCI host (and NOT committed to git).

| Credential | Variable | Required | Status |
|------------|----------|----------|--------|
| JWT access secret | `JWT_SECRET` | ✅ Blocking | ☐ |
| JWT refresh secret | `JWT_REFRESH_SECRET` | ✅ Blocking | ☐ |
| Database URL (prod) | `DATABASE_URL` | ✅ Blocking | ☐ |
| Redis URL (prod) | `REDIS_URL` | ✅ Blocking | ☐ |
| Stripe secret key (live) | `STRIPE_SECRET_KEY` | ✅ Blocking | ☐ |
| Stripe webhook secret | `STRIPE_WEBHOOK_SECRET` | ✅ Blocking | ☐ |
| ERP internal secret | `ERP_INTERNAL_SECRET` | ✅ Blocking | ☐ |
| Enterprise ERP URL | `ERP_ENTERPRISE_URL` | ✅ Blocking | ☐ |
| Google OAuth client ID | `GOOGLE_CLIENT_ID` | ✅ Blocking | ☐ |
| Google OAuth client secret | `GOOGLE_CLIENT_SECRET` | ✅ Blocking | ☐ |
| Firebase project credentials | `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY` | ✅ Blocking | ☐ |
| SMS provider (MSG91 or Twilio) | `MSG91_API_KEY` or `TWILIO_*` | ✅ Blocking | ☐ |
| Google Maps API key | `GOOGLE_MAPS_API_KEY` | ✅ Blocking | ☐ |
| Sentry DSN | `SENTRY_DSN` | Recommended | ☐ |
| SendGrid API key | `SENDGRID_API_KEY` | Recommended | ☐ |
| MinIO / S3 credentials | `MINIO_*` or `AWS_*` | Recommended | ☐ |
| PayHere credentials | `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET` | If using PayHere | ☐ |
| OpenAI / Anthropic key | `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | For AI features | ☐ |

---

## Section 8 — Log Persistence (Task 3.4)

Currently logs are written to `/tmp/doorli-logs` (volatile tmpfs). Before go-live:

```bash
# Option A: Docker log driver to file
# In docker-compose.prod.yml, add to each service:
# logging:
#   driver: "json-file"
#   options:
#     max-size: "50m"
#     max-file: "5"

# Option B: Log rotation with logrotate
sudo tee /etc/logrotate.d/doorli > /dev/null << 'EOF'
/opt/doorli/logs/*.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
    sharedscripts
    postrotate
        docker compose -f /opt/doorli/docker-compose.prod.yml kill -s USR1 api
    endscript
}
EOF

# Option C: Ship logs to CloudWatch / Loki / Datadog
# Configure Docker log driver: awslogs or loki
```

| # | Check | Status |
|---|-------|--------|
| 8.1 | Log rotation or log shipping configured (not tmpfs) | ☐ |
| 8.2 | At least 30 days of log history retained | ☐ |
| 8.3 | Access logs include request latency and status codes | ☐ |

---

## Final Go/No-Go Gate

Do **not** open to public traffic until all blocking (✅ Blocking) items above are ✅.

```bash
# Run full verification suite:
./deploy/oci/open-ingress.sh
./scripts/verify-dns-tls.sh
./scripts/verify-erp-callback.sh
./scripts/verify-stripe-webhook.sh
DOORLI_API_BASE=https://doorli.me ./scripts/e2e-smoke-authenticated.sh
./scripts/smoke-oci.sh   # existing basic smoke
```

If all pass → **Doorli is production-ready.** 🚀

---

*This checklist was generated as part of the Doorli Full Platform Completion spec, Phase 10 (Tasks 4 & 5).*
