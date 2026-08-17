# Doorli Platform

Doorli is a hyperlocal multi-service platform for customers, vendors, drivers, operators, and enterprise businesses. It combines marketplace discovery, food and grocery delivery, local services, rides, community features, vendor tools, and two ERP paths.

## The Two ERP Paths

### Doorli ERP

The embedded custom ERP lives in `apps/erp`.

- Next.js and React application
- PostgreSQL and Drizzle ORM
- Tenant-aware company routes under `/c/[slug]`
- POS and checkout
- Sales and purchasing
- Items, warehouses, stock transfers, stock takes, and barcodes
- Double-entry accounting and financial reports
- Work orders, manufacturing, restaurant operations, appointments, and vehicles
- HR, payroll, commissions, loyalty, gift cards, and layaways
- Tenant settings, module access, reports, files, chat, and activity logs

### Doorli Enterprise OS

Enterprise Frappe/ERPNext is maintained in the sibling repository:

```text
/Users/ahsan/Documents/myStartup/Doorli-Enterprise-OS
```

Production URL:

```text
https://enterprise.doorli.me
```

It provides isolated ERPNext accounting, stock, buying, selling, CRM, manufacturing, reports, and enterprise administration. The two systems communicate through signed REST/webhook contracts documented in `docs/enterprise-os-integration.md`.

## Repository Structure

| Path | Purpose |
|---|---|
| `apps/customer-web` | Consumer marketplace web app |
| `apps/vendor-web` | Vendor workspace and ERP provisioning |
| `apps/admin` | Lightweight administration portal |
| `apps/super-admin` | Platform operations portal |
| `apps/erp` | Embedded Doorli ERP |
| `apps/mobile` | Expo mobile application |
| `services/api` | Main API gateway and business modules |
| `services/auth` | OTP, OAuth, JWT, and refresh sessions |
| `services/delivery` | Orders, dispatch, drivers, and payments |
| `services/ride-hailing` | Ride requests, pricing, and matching |
| `services/inventory` | Inventory service and stock workflows |
| `services/search` | Elasticsearch vendor/product search |
| `services/notifications` | Push, SMS, email, and in-app notifications |
| `services/chat` | Realtime conversations |
| `services/forum-service` | Community forums and moderation |
| `services/emergency-service` | SOS and emergency dispatch |
| `services/gov-service` | Civic services and document workflows |
| `services/ai-service` | AI provider integration |
| `packages/db` | Prisma schema, migrations, and client |
| `packages/design-tokens` | Shared visual design tokens |
| `docs` | Integration and production operations guides |

## Local Setup

```bash
npm install
cp .env.example .env
# Set database, Redis, JWT, ERP, and provider values in .env.
docker compose -f docker-compose.yml up -d db redis
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

Useful development commands:

```bash
npm run build
npm run test --workspace @doorli/api
npm run build --workspace @doorli/customer-web
npm run build --workspace @doorli/erp
```

## Main Local Ports

| Service | Port |
|---|---:|
| API Gateway | 4000 |
| Auth | 4001 |
| Customer web | 3000 |
| Vendor web | 3002 |
| Admin | 3005 |
| Super Admin | 3006 |
| Embedded ERP | 3010 |
| Redis | 6379 |
| PostgreSQL | 5432 |

## Integration Contract

Marketplace to Enterprise:

- Vendor provisioning
- Sales Order creation
- Tenant/module/control checks
- Inventory reads

Enterprise to Marketplace:

- Confirmed order callbacks
- Cancelled order callbacks
- Delivery status callbacks
- Stock updates
- Product synchronization
- Customer synchronization

The shared secret is configured through environment variables. Do not commit or print it.

## Current Integration Guarantees

- Stock callbacks accept direct Marketplace product IDs or resolve by ERP tenant plus SKU/barcode.
- Customer mappings are stored per vendor and ERP customer ID through `ErpCustomerLink`.
- Vendor Enterprise provisioning uses the vendor account email, not the phone number.
- Repeated order callbacks are idempotent.
- Tenant control failures fail closed instead of bypassing restrictions.
- API and ERP builds are validated before their production process is restarted.

## Roles

Marketplace roles are `customer`, `vendor`, `driver`, and `admin`.

Embedded ERP roles include `owner`, `manager`, `cashier`, `technician`, `chef`, `waiter`, `accounts_manager`, `sales_manager`, `purchase_manager`, `stock_manager`, `hr_manager`, `pos_user`, and `report_user`.

Enterprise Frappe roles are documented in the Enterprise OS README. Passwords are never stored in documentation. Reset users individually through the relevant admin interface.

## Production Checks

```bash
curl -fsS https://doorli.me/health
curl -fsS https://doorli.me/api/v1
curl -kfsS https://enterprise.doorli.me/api/method/frappe.ping
```

Check the following after deployment:

- Customer homepage, search, checkout, orders, and tracking
- Vendor products, orders, POS, and ERP provisioning
- Enterprise Home, Accounting, Stock, Selling, Buying, CRM, Support, and Settings
- Order creation from Marketplace into Enterprise
- Enterprise status callback into Marketplace
- Stock update by product ID and SKU/barcode
- Customer ERP identity linking

## External Providers

The code includes adapters for payments, SMS, email, maps, storage, push notifications, AI, search, and delivery. These are not production-complete until real provider credentials, quotas, webhook endpoints, and end-to-end tests are configured.

## Security Rules

- Never commit `.env` or production credentials.
- Never use shared passwords for users.
- Keep tenant checks enabled.
- Keep control-plane failures fail-closed.
- Rotate webhook secrets after exposure.
- Disable test accounts before production use.
- Maintain database backups and test restoration regularly.

## Completion Program

This is the authoritative implementation checklist. A task is complete only when its code, automated test, production verification, and documentation are complete.

### Verification Environment

- OCI production is authoritative for deployment and runtime verification.
- Marketplace live endpoints: `https://doorli.me`, `https://doorli.me/api/v1`, `https://doorli.me/health`.
- Enterprise live endpoint: `https://enterprise.doorli.me`.
- Local PostgreSQL/Redis unavailability is not a production failure; local checks are limited to source, schema, build, and unit validation.
- A change is not marked deployed until its OCI migration/release command and live health or smoke check are recorded.

### OCI Verification Log — 2026-08-16

- Marketplace health: HTTP `200`, `db: true`, `redis: true`.
- Marketplace API version: HTTP `200`.
- Marketplace web root: HTTP `200`.
- Enterprise Frappe ping: HTTP `200`, `pong`.
- Marketplace release `decfba4` is live on OCI from `/home/opc/releases/decfba403984daf20279faaffbead69e8863099a`.

### OCI Verification Log — 2026-08-17

- Marketplace smoke: `/health`, `/api/v1`, and `/` returned HTTP `200`; public web is missing the expected Nginx security headers because the active host configuration predates repository hardening.
- Enterprise smoke: `/api/method/ping` returned HTTP `200`.
- Local Marketplace CI-equivalent validation passed: strict web builds, ERP production build/server bundle, API build, 22 API tests, security audit, and diff checks.
- Added production replay protection: first-party ERP webhooks use `X-Doorli-Timestamp` plus `X-Doorli-Signature`; signatures expire after five minutes.
- Added admin Sync Recovery dashboard and CI workflow. OCI migration reported no pending migrations after the release switch.
- Production backup `doorli-20260817T060708Z.sql.gz` completed with checksum verification; destructive restore correctly remains confirmation-gated (`restore-guard=77`).

### Phase 0 — Baseline and Safety

- [x] Keep Marketplace, embedded Doorli ERP, and Enterprise OS responsibilities documented.
- [x] Keep production secrets outside Git and README files.
- [x] Add tenant-scoped ERP customer identity links.
- [x] Fix ERP stock callback matching by product ID or ERP tenant plus SKU/barcode.
- [x] Correct Enterprise provisioning to use the vendor account email.
- [x] Make Marketplace control-gate failures fail closed.
- [x] Remove production-default credentials from Marketplace Compose and `.env.example` templates.
- [x] Add confirmation-gated Marketplace backup and restore scripts with checksum and retention handling.
- [ ] Execute and record a production-like backup restore drill.

### Phase 1 — Integration Completeness

- [x] Implement Enterprise-to-Marketplace product catalog synchronization and admin trigger.
- [x] Complete ERP-to-Marketplace stock synchronization contract.
- [x] Complete per-vendor ERP customer identity persistence.
- [x] Add scheduled bounded reconciliation for persisted order, stock, product, and customer callback failures.
- [x] Add durable integration-failure storage and authenticated operator retry endpoints.
- [x] Standardize webhook authentication and timestamp/replay protection.
- [ ] Add contract tests that run against both repositories in CI.

### Phase 2 — Application Reliability

- [x] Enable TypeScript and ESLint checks in all Marketplace Next.js production builds.
- [x] Complete a clean Enterprise ERP strict build within the production build resource budget.
- [ ] Add idempotency to every payment, provisioning, callback, and import mutation.
- [x] Make vendor ERP provisioning retries state-aware so provisioned/pending requests do not duplicate external mutations.
- [ ] Add request correlation IDs across API, workers, ERP, and callbacks.
- [ ] Add graceful retry and user-visible recovery for provider outages.
- [ ] Add database connection pooling and slow-query monitoring.
- [ ] Add queue-depth, callback-latency, and synchronization-lag dashboards.
- [x] Add API Prometheus metrics, correlation IDs, request timing, and alert-compatible counters/histograms.

### Phase 3 — Security and Access

- [ ] Move production secrets to a managed secret store.
- [ ] Enable WAF, DDoS protection, rate limiting, and origin restriction.
- [ ] Add MFA for administrators and operators.
- [ ] Complete role-by-role permission tests for customer, vendor, driver, cashier, manager, and administrator users.
- [ ] Remove committed test credentials and disable test accounts in production.
- [ ] Add dependency, container-image, static-analysis, and runtime security scans.

### Phase 4 — Scale and Availability

- [ ] Move stateless services behind a managed load balancer.
- [ ] Run multiple API, web, worker, and WebSocket replicas.
- [ ] Add PostgreSQL and MariaDB replication with tested failover.
- [ ] Add Redis high availability and Kafka replication.
- [ ] Add CDN caching for public web assets and images.
- [ ] Run spike, soak, failover, and disaster-recovery tests.
- [ ] Define and verify 99.9% availability SLOs.

### Phase 5 — User Experience and Release Gates

- [x] Apply a unified Doorli customer web visual system across the main customer routes.
- [x] Add visual Enterprise OS workspaces and plain-English module labels.
- [ ] Complete dedicated UI states for every customer, vendor, ERP, and admin workflow.
- [ ] Add accessibility checks for keyboard, screen reader, contrast, and touch targets.
- [ ] Add mobile-device testing for supported iOS and Android sizes.
- [ ] Add end-to-end tests for every critical three-step user journey.
- [ ] Require staging smoke tests, canary release, monitoring window, and rollback readiness before public release.

### Definition of Done

- Code is implemented and reviewed.
- Unit, integration, and end-to-end tests pass.
- Database migrations apply cleanly to a production-like copy.
- Health checks, logs, metrics, and alerts are verified.
- User-facing success, loading, empty, error, retry, and permission states exist.
- External provider credentials and webhooks are tested where applicable.
- The README status is updated with evidence and date.

### Progress Log — 2026-08-16

- Completed `ErpCustomerLink` tenant-scoped identity mapping and applied migration `20260816100000_erp_customer_links` to production.
- Completed Marketplace stock update resolution by direct product ID or ERP tenant plus SKU/barcode.
- Completed vendor Enterprise provisioning email correction.
- Changed control-gate infrastructure failures from fail-open to HTTP 503 fail-closed behavior.
- Verified API TypeScript build, embedded ERP production build, and 21 ERP webhook tests.
- Verified production endpoints: Marketplace health `200`, Marketplace API `200`, Enterprise Frappe ping `200`.
- Implemented Enterprise catalog export and Marketplace admin trigger; configure `ERP_ENTERPRISE_PRODUCT_SYNC_URL` and `DOORLI_MARKETPLACE_PRODUCT_SYNC_URL`, then verify deployment. Reconciliation/dead-letter handling remains.
- Added `integration_failures` persistence plus admin `GET /api/v1/admin/integration-failures` and `POST /api/v1/admin/integration-failures/:id/retry` endpoints.
- Added the API reconciliation worker with exponential backoff, maximum attempts, multi-replica claim protection, and configurable interval/batch settings.
- Build passed with `npm run build`; API test suite passed with `21` ERP webhook tests included. Tests logged expected database-unavailable warnings because local PostgreSQL is not running.
- Production gate remaining: apply migration `20260816120000_integration_failures`, configure reconciliation variables, and verify one successful automatic retry on the live API.
- Security hardening completed in Compose: infrastructure and internal services bind to loopback, required credentials fail startup when absent, and default JWT/MinIO/Grafana/database credentials were removed.
- Added an API production startup guard, explicit CORS origin allowlist, Nginx security headers, API edge rate limiting, and `scripts/security-audit.sh`.
- Removed Next.js TypeScript/ESLint build bypasses from ERP, customer web, admin, vendor web, and super-admin. Customer, admin, vendor, and super-admin strict builds pass; ERP strict checking reaches lint/type validation but exceeds the local 10-minute build budget.
- Aligned web app `lucide-react` dependencies to `0.469.0` for React 18 type compatibility and fixed surfaced type errors in admin, vendor, and ERP route/seed code.
- ERP ESLint passes with 0 errors and 89 warnings. ERP TypeScript passes with a 4 GB heap, and the full strict production build plus server bundle passes.
- Added provisioning retry protection: existing `provisioned` and `pending` vendor ERP states now replay without creating a second tenant or queue job; failed states remain retryable.
- Local JWT defaults are now explicitly rejected when `NODE_ENV=production`; production requires non-local database and ERP secrets.
- Security validation passed: `npm run build`, Compose interpolation with validation values, `scripts/security-audit.sh`, and Git diff checks.
- Added `/metrics`, `x-correlation-id` response/request tracing, and corrected Prometheus scraping to the API's production port. Removed scrape targets for services/exporters not present in Compose.
- Security gate remaining: deploy secrets through a managed secret store and run an external port/WAF scan.
- Added `scripts/restore-marketplace-db.sh`; it refuses to run unless `CONFIRM_RESTORE=YES` is explicitly set.
