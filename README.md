# Doorli

Doorli is a local commerce and operations platform for communities. Customers discover nearby businesses, order products, book services, arrange rides, and follow delivery progress. Vendors run their storefronts, orders, stock, POS, and business operations. Drivers manage delivery work. Operators administer the marketplace. Larger businesses can use the embedded Doorli ERP or the isolated Doorli Enterprise OS.

Doorli is designed around one principle: make local transactions feel clear, trustworthy, and connected from discovery to fulfillment.

## Product Surface

### Customer Marketplace

The customer experience is available on web and Android. It brings together:

- Food and grocery discovery
- Local shops and services
- Hotels, halls, events, and appointments
- Courier and errand requests
- Rides and local mobility
- Shopping cart, checkout, orders, and tracking
- Wallets, bills, subscriptions, loyalty, and promotions
- Community forums, events, notifications, and support
- Emergency and civic-service entry points
- Search, recommendations, and Doorli AI integrations

Web app: `apps/customer-web`

Production: `https://doorli.me`

### Doorli Mobile

The Expo application provides the same role-aware Doorli experience on Android and is structured for iOS builds.

Mobile capabilities include:

- Password login and account registration
- Customer, vendor, driver, and admin role selection
- Customer browsing, cart, checkout, bookings, rides, and orders
- Vendor hub, POS, products, stock, orders, and bookings
- Driver jobs, navigation, earnings, documents, and profile
- Admin and super-admin operational workspaces
- Push notifications, maps, camera, location, and document flows
- English, Sinhala, and Tamil language support

Mobile app: `apps/mobile`

Build a release APK locally:

```bash
cd apps/mobile/android
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home \
EXPO_PUBLIC_API_URL=https://doorli.me \
EXPO_PUBLIC_AUTH_URL=https://doorli.me \
./gradlew app:assembleRelease
```

APK output: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

The mobile app uses password authentication. Phone OTP remains a backend compatibility path for older clients but is not presented in the current mobile onboarding flow.

### Vendor Workspace

The vendor web app is for local businesses that sell products, food, services, rooms, or appointments through Doorli.

- Vendor onboarding and authentication
- Business profile and category setup
- Product and menu management
- Inventory and stock visibility
- Order and booking workflows
- Cashier and POS operations
- ERP provisioning status
- Vendor analytics and account settings

App: `apps/vendor-web`

### Driver and Delivery Operations

Drivers are provisioned by Doorli after the required identity and vehicle checks. The platform supports:

- Job offers and dispatch
- Delivery status updates
- Navigation and location tracking
- Vehicle and document records
- Earnings and driver profile management

The delivery service owns order dispatch, driver workflows, and payment-related delivery operations.

### Administration

The platform has separate operational surfaces:

| Surface | App | Purpose |
|---|---|---|
| Admin | `apps/admin` | Marketplace users, vendors, drivers, orders, support, reports, and operations |
| Super Admin | `apps/super-admin` | Platform controls, global settings, health, tenants, modules, quotas, and recovery |
| Embedded ERP | `apps/erp` | Tenant business operations and accounting |
| Enterprise OS | sibling repository | Frappe/ERPNext operations for larger businesses |

## ERP Options

Doorli supports two complementary ERP paths. They must not be treated as the same database or deployment.

### Embedded Doorli ERP

The embedded ERP is part of this repository and is optimized for Doorli-native tenant operations.

Technology:

- Next.js and React
- PostgreSQL
- Drizzle ORM
- Tenant routes under `/c/[slug]`
- POS and checkout
- Sales, purchasing, invoices, and payments
- Items, warehouses, stock transfers, stock takes, and barcodes
- Accounting and financial reports
- Work orders, manufacturing, restaurant operations, and appointments
- Vehicle, dealership, service, HR, payroll, commission, loyalty, and gift-card workflows
- Tenant settings, permissions, modules, reports, files, chat, and activity logs

App: `apps/erp`

Local URL: `http://localhost:3010`

### Doorli Enterprise OS

Doorli Enterprise OS is an isolated Frappe/ERPNext platform for retailers, supermarkets, multi-branch businesses, dealerships, and larger vendors.

Repository:

```text
/Users/ahsan/Documents/myStartup/Doorli-Enterprise-OS
```

Production: `https://enterprise.doorli.me`

It provides:

- Accounting and financial controls
- Buying, selling, suppliers, and customers
- Stock, warehouses, items, and inventory
- CRM, support, projects, HR, manufacturing, and quality
- Role-scoped workspaces and native Frappe permissions
- Doorli-branded workspace navigation
- Marketplace vendor provisioning and order integration

Read the Enterprise OS repository README for its Docker, Frappe, backup, role, and OCI procedures.

## Authentication and Roles

The marketplace authentication contract is served through `/api/v1/auth` and uses the marketplace PostgreSQL database.

Supported marketplace roles:

- `customer`: browse, order, book, pay, track, and manage personal account data
- `vendor`: manage a business, catalog, stock, orders, bookings, and POS
- `driver`: receive and complete delivery jobs after Doorli provisioning
- `admin`: operate marketplace support, moderation, users, vendors, drivers, and reports
- `super_admin`: platform control-plane access where enabled by the relevant operational surface

Authentication behavior:

- Customers can register with name, email, and password.
- Vendors can register with name, email, password, business name, and category.
- Vendor accounts may require verification and ERP provisioning before all business capabilities are enabled.
- Drivers and administrators are provisioned accounts and cannot self-register through the customer flow.
- Vendor access can require a business name or vendor ID in addition to the password.
- Existing OTP payload formats remain accepted by the API for compatibility, but the current mobile UI is password-only.
- Enterprise users use Frappe/ERPNext authentication and native Enterprise permissions separately from marketplace accounts.

Never put passwords, API tokens, database URLs, webhook secrets, or cloud credentials in Git or documentation. Use the environment and the appropriate admin reset flow.

## Architecture

### Applications

| Path | Responsibility |
|---|---|
| `apps/customer-web` | Customer marketplace web experience |
| `apps/vendor-web` | Vendor workspace and onboarding |
| `apps/admin` | Marketplace administration |
| `apps/super-admin` | Platform operations and control plane |
| `apps/erp` | Embedded Doorli ERP |
| `apps/mobile` | Expo Android/iOS client |
| `apps/hotel` | Hotel and accommodation experience |

### Services

| Path | Responsibility |
|---|---|
| `services/api` | API gateway, marketplace modules, auth routes, ERP callbacks, and business logic |
| `services/auth` | Legacy/compatibility auth service, OAuth, device registration, and OTP integrations |
| `services/delivery` | Orders, dispatch, drivers, payments, and delivery workflows |
| `services/ride-hailing` | Ride estimates, requests, pricing, and matching |
| `services/inventory` | Inventory and stock service |
| `services/search` | Search and indexing |
| `services/notifications` | Push, SMS, email, and in-app notifications |
| `services/chat` | Realtime conversations |
| `services/forum-service` | Community forums and moderation |
| `services/emergency-service` | SOS and emergency dispatch |
| `services/gov-service` | Civic services and document workflows |
| `services/ai-service` | AI provider integration |

### Shared Packages

| Path | Responsibility |
|---|---|
| `packages/db` | Prisma schema, migrations, generated client, and seed data |
| `packages/types` | Shared TypeScript contracts |
| `packages/utils` | Shared validation, middleware, and utility functions |
| `packages/design-tokens` | Doorli visual tokens and shared styling primitives |
| `docs` | Operations, deployment, integration, and production evidence |

## Marketplace and Enterprise Integration

The Marketplace and Enterprise OS use signed, tenant-aware contracts.

Marketplace to Enterprise:

- Vendor provisioning
- Company and scoped user creation
- Sales Order creation
- Inventory reads
- Tenant status, module, and quota controls
- Product catalog synchronization

Enterprise to Marketplace:

- Order confirmation and status callbacks
- Delivery status callbacks
- Stock updates
- Product synchronization
- Customer identity synchronization

Reliability guarantees include:

- Tenant-scoped ERP customer links
- Vendor and tenant ownership checks
- Idempotent order callbacks
- Timestamped HMAC replay protection
- Durable integration-failure records
- Bounded retry and reconciliation workers
- Fail-closed control-plane behavior

Integration secrets are supplied by environment variables. Do not print or commit them.

## Repository Setup

Requirements:

- Node.js 22
- npm 10 or newer
- Docker and Docker Compose
- PostgreSQL
- Redis
- Java 21 for local Android release builds

Install dependencies:

```bash
npm install
cp .env.example .env
```

Configure `.env` with local database, Redis, JWT, ERP, storage, payment, email, SMS, maps, and other provider values as needed. Do not copy production secrets into local files that are committed.

Start local infrastructure:

```bash
docker compose up -d db redis
```

Prepare the database:

```bash
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

Run the main development stack:

```bash
npm run dev
```

Useful commands:

```bash
npm run build
npm run test --workspace @doorli/api
npm run build --workspace @doorli/customer-web
npm run build --workspace @doorli/erp
npm run typecheck --workspace @doorli/mobile
```

## Local Ports

| Service | Port |
|---|---:|
| API Gateway | `4000` |
| Auth compatibility service | `4001` |
| Customer web | `3000` |
| Vendor web | `3002` |
| Admin | `3005` |
| Super Admin | `3006` |
| Embedded ERP | `3010` |
| Redis | `6379` |
| PostgreSQL | `5432` |

## Production and Deployment

Production is hosted on OCI.

| System | URL |
|---|---|
| Marketplace | `https://doorli.me` |
| Marketplace API | `https://doorli.me/api/v1` |
| Marketplace health | `https://doorli.me/health` |
| Enterprise OS | `https://enterprise.doorli.me` |

The GitHub Actions deployment workflow is `.github/workflows/deploy-oci.yml`. It:

1. Checks whether OCI deployment secrets are configured.
2. Creates an isolated release checkout.
3. Preserves production environment configuration outside Git.
4. Cleans abandoned releases, npm caches, stale Next caches, and old Docker images.
5. Installs dependencies and generates database clients.
6. Applies database migrations.
7. Builds the workspace applications.
8. Starts the Doorli processes.
9. Verifies API, inventory, customer, vendor, admin, super-admin, and ERP endpoints.

The ERP build disables persistent production webpack caching because the OCI host has a constrained disk volume. Remote Google Font fetching is not required by the web apps, which makes production builds deterministic when outbound access is limited.

Manual production checks:

```bash
curl -fsS https://doorli.me/health
curl -fsS https://doorli.me/api/v1
curl -kfsS https://enterprise.doorli.me/api/method/frappe.ping
```

After deployment, verify at minimum:

- Customer landing page, search, login, checkout, orders, and tracking
- Vendor login, onboarding, catalog, POS, orders, and ERP status
- Driver login, jobs, status updates, and navigation
- Admin login, users, vendors, support, reports, and recovery tools
- Enterprise login, Home, Accounting, Stock, Selling, Buying, CRM, Support, and Settings
- Marketplace order creation and Enterprise callback delivery
- Stock updates by product ID and SKU/barcode

## External Providers

Doorli contains adapters for providers including:

- Payment processing
- SMS and OTP
- Email and transactional messaging
- Maps and geolocation
- Object storage
- Push notifications
- AI providers
- Search infrastructure
- Delivery and dispatch systems

Provider-dependent functionality is only production-ready after real credentials, quotas, webhook URLs, monitoring, and end-to-end tests are configured.

## Security and Data Rules

- Never commit `.env`, passwords, API keys, private keys, tokens, or production exports.
- Never use shared passwords for real users.
- Keep marketplace and Enterprise databases isolated.
- Enforce tenant ownership and role checks on every protected operation.
- Keep control-plane failures fail-closed.
- Rotate webhook secrets after exposure.
- Disable test accounts before production use.
- Back up database and site files before migrations.
- Test restoration in a production-like environment.
- Add MFA, managed secrets, WAF, external scanning, and least-privilege review before treating the platform as fully hardened.

## Current Limitations

- Payment, SMS, email, maps, storage, AI, and delivery integrations require provider-specific production configuration.
- Vendor Enterprise provisioning can remain pending until verification and external ERP provisioning succeed.
- Local development does not require every production provider to be available.
- Full role-by-role browser accessibility and end-to-end coverage is still an ongoing quality program.
- Production restore drills, managed secret storage, WAF/DDoS controls, and multi-region availability remain operational follow-ups.

## Documentation Map

| Document | Scope |
|---|---|
| `docs/production-checklist.md` | Marketplace production acceptance checklist |
| `docs/OCI_DUAL_REPO_OPS.md` | Marketplace and Enterprise OCI operations |
| `docs/enterprise-os-integration.md` | Marketplace/Enterprise contract details |
| `apps/mobile/EAS.md` | Expo/EAS build notes |
| `apps/erp/README.md` | Embedded ERP development and operations |
| `apps/customer-web/README.md` | Customer web application notes |
| `apps/admin/README.md` | Admin application notes |
| `../Doorli-Enterprise-OS/README.md` | Enterprise OS deployment and permissions |

## Definition of Done

A Doorli feature is complete when:

- The user flow has loading, success, empty, error, retry, and permission states.
- Authentication and tenant authorization are enforced server-side.
- Database changes have a migration and rollback/restore consideration.
- Unit, integration, build, and relevant end-to-end checks pass.
- Production health and smoke checks pass after deployment.
- External provider behavior is verified where applicable.
- Documentation and operational evidence are updated.

## System Architecture Plan

The platform is organized into four layers. Each layer has a clear ownership boundary so that marketplace traffic, business operations, and enterprise data do not become one unmanageable application.

```text
                    Customers / Vendors / Drivers / Operators
                                      |
                +---------------------+---------------------+
                |                                           |
        Customer Web / Mobile                    Vendor / Admin Web
                |                                           |
                +---------------------+---------------------+
                                      |
                         Doorli API Gateway :4000
                                      |
       +------------------+-----------+-----------+------------------+
       |                  |                       |                  |
   Auth + JWT        Marketplace modules     Delivery/Rides      Realtime
       |                  |                       |                  |
       +------------------+-----------+-----------+------------------+
                                      |
                 PostgreSQL + Redis + queues + search + storage
                                      |
                    ERP integration and signed callbacks
                         /                         \
              Embedded Doorli ERP              Enterprise OS
                 PostgreSQL/Drizzle             Frappe/MariaDB
```

### Request and Order Flow

1. A customer opens the marketplace or mobile app.
2. The client calls the API gateway using the `/api/v1` contract.
3. The gateway authenticates the user, validates input, applies role and tenant checks, and routes to the owning module or service.
4. The marketplace stores the customer, vendor, cart, order, payment, delivery, and integration state in the marketplace database.
5. If the vendor is connected to an ERP, the ERP integration layer provisions or resolves the tenant and creates the external order using an authenticated request.
6. Enterprise status, delivery status, stock, product, and customer updates return through signed, timestamped callbacks.
7. Failed integration operations are persisted, retried with bounded backoff, and exposed to operators for recovery.

### Data Ownership

| Data domain | Owner | Rule |
|---|---|---|
| Marketplace users and roles | Marketplace PostgreSQL / Prisma | One identity contract for customer, vendor, driver, and admin access |
| Marketplace vendors and products | Marketplace PostgreSQL | Vendor ownership and visibility are enforced by API authorization |
| Orders and delivery state | Marketplace API and Delivery service | Marketplace owns customer-facing order lifecycle |
| Embedded ERP tenants | Embedded ERP PostgreSQL / Drizzle | Tenant data is scoped by company slug and role permissions |
| Enterprise companies and accounting | Enterprise OS MariaDB / Frappe | Enterprise OS remains isolated and uses native Frappe permissions |
| ERP customer links | Marketplace integration tables | Mapping is scoped by vendor and external ERP customer identifier |
| Integration failures | Marketplace PostgreSQL | Durable retry and reconciliation state, never an in-memory-only queue |
| Sessions and short-lived cache | Redis | No critical business record may exist only in Redis |
| Media and documents | Configured object storage | Provider and bucket credentials remain environment-only |

### Availability and Failure Behavior

- API and web processes are stateless wherever possible and can be restarted from the release artifact.
- PostgreSQL is the source of truth for business state.
- Redis is used for cache, OTP compatibility, rate limits, queues, and realtime coordination.
- Integration failures are recorded before an operation is reported as recoverable.
- Control-plane state cannot be bypassed when its backing service is unavailable.
- External provider failures produce explicit error and retry states instead of silent success.
- Deployment health checks cover API, inventory, customer web, vendor web, admin, super-admin, and ERP endpoints.

## Implementation Status

The following matrix describes the current implementation state, not an aspirational feature list.

| Capability | Current implementation | Status |
|---|---|---|
| Customer web marketplace | Next.js app with search, category discovery, cart, checkout, orders, tracking, bookings, community, rides, and service surfaces | Built |
| Customer mobile app | Expo app with native Android project, role-aware navigation, customer flows, vendor flows, driver flows, and admin surfaces | Built and APK verified |
| Mobile password auth | Customer/vendor registration, customer/vendor/driver/admin role selection, production API configuration, readable form controls | Built and verified |
| Mobile phone OTP | Backend compatibility contract retained; hidden from current mobile UI | Compatibility only |
| Vendor onboarding | Password signup with business name and category; vendor verification and ERP provisioning status | Built; approval remains operational |
| Driver onboarding | Provisioned account model with jobs, documents, earnings, and navigation | Built; identity/vehicle operations remain required |
| Admin operations | Users, vendors, drivers, orders, support, reports, settings, and integration recovery | Built |
| Super-admin operations | Platform controls, health, users, vendors, settings, modules, quotas, and control-plane workflows | Built; role acceptance testing remains |
| Embedded ERP | POS, stock, accounting, selling, buying, service, restaurant, vehicle, HR, reports, and tenant workspace routes | Production build passes |
| Enterprise OS | Frappe/ERPNext runtime, Doorli Core integration, permissions, workspaces, vendor provisioning, order callbacks, stock, and catalog integration | Deployed; further acceptance work remains |
| Marketplace authentication | Password login, registration, JWT access/refresh tokens, role checks, vendor business validation, legacy OTP compatibility | Built |
| Search | Search service and marketplace search integration | Built; production provider configuration required |
| Notifications | Push, SMS, email, and in-app notification adapters | Built; provider configuration required |
| Payments | Payment adapters and checkout/payment workflows | Built; live provider credentials and webhooks required |
| Rides and delivery | Ride estimate/request flow, delivery dispatch, driver jobs, delivery callbacks | Built; live operational/provider validation required |
| ERP order integration | Signed provisioning, order creation, callback, stock, catalog, customer mapping, retry, and reconciliation paths | Built; cross-repository contract CI remains |
| Security baseline | Headers, CORS allowlist, rate limits, signed callbacks, fail-closed control gate, production secret checks | Built; managed secrets/WAF/MFA remain |
| Backups | Marketplace and Enterprise backup/archive scripts with checksum verification | Built; clean restore drill remains |
| OCI deployment | Isolated release checkout, database generation/migration, workspace build, process start, smoke checks, cleanup and disk protection | Built and workflow-managed |

## Build and Verification Evidence

The following commands are the minimum local CI-equivalent checks for the current repository:

```bash
# Marketplace and workspace build
npm run build

# API tests
npm run test --workspace @doorli/api

# Focused web builds
npm run build --workspace @doorli/customer-web
npm run build --workspace @doorli/erp

# Mobile type safety
npm run typecheck --workspace @doorli/mobile
```

The release APK is built with Java 21 and the production API root:

```bash
cd apps/mobile/android
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home \
EXPO_PUBLIC_API_URL=https://doorli.me \
EXPO_PUBLIC_AUTH_URL=https://doorli.me \
./gradlew app:assembleRelease
```

The APK must be installed on an Android emulator or device and launched after every native dependency, Metro, routing, or authentication change. A successful Gradle build alone is not considered mobile verification.

### Production Smoke Checklist

```bash
curl -fsS https://doorli.me/health
curl -fsS https://doorli.me/api/v1
curl -kfsS https://enterprise.doorli.me/api/method/frappe.ping
```

Then manually verify:

- Customer login, search, cart, checkout, order creation, and order tracking
- Vendor login, vendor registration, business profile, catalog, POS, and order state
- Driver login, job acceptance, status update, navigation, and earnings
- Admin access, user/vendor/driver management, support, reports, and recovery
- Enterprise login, company workspace, accounting, stock, selling, buying, reports, and settings
- Marketplace-to-Enterprise vendor provisioning and order creation
- Enterprise-to-Marketplace status, stock, catalog, and customer callbacks

## API Contract Map

The public API root is `https://doorli.me/api/v1` in production and normally `http://localhost:4000/api/v1` locally.

| API area | Main responsibility |
|---|---|
| `/auth` | Password login, customer/vendor registration, refresh, logout, and legacy OTP compatibility |
| `/users` | Current user profile and account data |
| `/vendors` | Vendor discovery, vendor management, business profiles, and ERP metadata |
| `/products` | Product catalog and availability |
| `/inventory` | Inventory service proxy and stock workflows |
| `/orders` | Delivery order creation, status, and customer order access |
| `/drivers` | Driver jobs and delivery operations |
| `/payments` | Payment and checkout integrations |
| `/rides` | Ride estimates, requests, and ride lifecycle |
| `/bookings` | Service, venue, hotel, and appointment bookings |
| `/community` and `/forums` | Community content and moderation |
| `/notifications` | Notification reads, delivery, and preferences |
| `/erp-webhooks` | Authenticated stock, order, delivery, and integration callbacks |
| `/admin` | Operator dashboards, users, vendors, reports, and integration recovery |
| `/control` | Control-plane modules, quotas, tenant state, and platform switches |

Every write endpoint must validate input, authenticate the caller, enforce role and tenant ownership, and return an actionable error. External mutation endpoints must additionally be idempotent or replay-safe.

## Environment Model

### Local Environment

Local `.env` normally contains:

- `DATABASE_URL`
- `REDIS_URL`
- JWT access and refresh secrets
- Internal service URLs
- ERP integration URLs and development secrets
- Optional provider credentials
- Optional public web/mobile API configuration

Use placeholders or local-only values. Never copy `.env` from OCI into Git or a public issue.

### Production Environment

Production secrets are stored on the OCI host or in the deployment environment and are copied into an isolated release only at deploy time. Production requires:

- Non-default database credentials
- Non-default JWT secrets
- ERP and webhook secrets
- Provider credentials where the feature is enabled
- Explicit CORS origins
- TLS endpoints
- Backup and restore credentials

The workflow must fail before build or start when required production values are missing. The repository must never be the source of truth for those values.

## Delivery Plan

### Completed Foundation

- Monorepo workspace structure and shared packages
- Marketplace web and mobile clients
- API gateway and service boundaries
- Marketplace PostgreSQL/Prisma schema and migrations
- Redis-backed queues, cache, and realtime foundations
- Role-aware authentication and protected routes
- Customer, vendor, driver, admin, and super-admin application surfaces
- Embedded ERP tenant foundation
- Isolated Enterprise OS integration repository
- Signed and timestamped ERP callbacks
- Idempotent order and provisioning operations
- Durable integration failure and retry model
- OCI release deployment and production smoke verification
- Mobile Android native generation and standalone APK build
- Production build disk cleanup and no-remote-font build hardening

### Next Implementation Priorities

1. Complete automated contract tests that run against Marketplace and Enterprise OS together.
2. Complete role-by-role authenticated browser tests for customer, vendor, driver, cashier, manager, admin, and Enterprise roles.
3. Run a clean production-like database and site-file restore drill for both databases.
4. Move production secrets to a managed secret store.
5. Add MFA for admin, super-admin, and Enterprise operator accounts.
6. Add WAF, DDoS controls, origin restrictions, and external port scanning.
7. Add queue depth, callback latency, ERP synchronization lag, and provider failure dashboards.
8. Add database pooling, slow-query monitoring, and tested failover.
9. Complete payment, SMS, email, maps, storage, push, AI, and delivery provider certification.
10. Add mobile device matrix testing for Android and iOS release candidates.
11. Complete keyboard, screen-reader, touch-target, contrast, and reduced-motion audits.
12. Add canary deployment, rollback automation, release freeze, and post-deploy monitoring windows.

### Remaining Risks

- A provider can be syntactically configured but still fail due to quota, webhook, sender, or account approval requirements.
- Enterprise provisioning can remain pending when external ERP credentials or tenant controls are unavailable.
- Local tests without PostgreSQL, Redis, or provider emulators cannot prove production integrations.
- A single OCI host remains a single infrastructure failure domain until replicas and failover are implemented.
- Test accounts must be disabled or rotated before a public production launch.
- A successful frontend build does not prove every authenticated role workflow works against live data.

## Release Gate

Before calling a release production-ready, all of the following must be true:

- Source, migrations, generated clients, and environment requirements are reviewed.
- `npm ci` succeeds on a clean host with enough disk space.
- Database migrations apply without destructive or unreviewed changes.
- Customer web, vendor web, admin, super-admin, and embedded ERP builds pass.
- Mobile typecheck passes and the release APK launches on a clean emulator.
- API tests and relevant service tests pass.
- Health checks return expected status from the public endpoints.
- Login and one critical journey pass for each enabled role.
- One Marketplace-to-Enterprise and one Enterprise-to-Marketplace integration path pass.
- Logs contain no startup crash, missing asset, font-fetch, migration, or unhandled callback errors.
- Backups exist and the rollback/recovery owner is known.
- README, deployment evidence, and remaining-risk status are updated.
