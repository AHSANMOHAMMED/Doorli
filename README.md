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
