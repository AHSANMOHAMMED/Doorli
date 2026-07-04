# 🚪 Doorli
### Everything Local. Delivered.

> **Doorli** is a community super-app that connects every local business, service, and venue to every resident — groceries, food, hotels, wedding halls, home repairs, beauty, and more — all in one app with real-time delivery and live tracking.

**Author:** AHSAN MOHAMMED · [ahsanmohammed828@gmail.com](mailto:ahsanmohammed828@gmail.com)

---

## 📚 Planning Documents

Internal architecture and build plans for Doorli:

| Document | Purpose | Scope |
|---|---|---|
| `doorli.pdf` | Enterprise Architecture Document | Scale architecture, microservices, security, infrastructure, long-term roadmap |
| `LocalConnect_Implementation_Plan (1).pdf` | Implementation Master Plan | Modules, schema, APIs, week-by-week MVP plan, build instructions |

**Build approach:** Ship the MVP first (monorepo, 16-week plan). Scale architecture as the platform grows.

---

## 📱 What is Doorli?

Doorli is the **one app your neighbourhood has always needed**.

Whether you are ordering groceries, booking a wedding hall, listing your shop, or driving deliveries in your area — Doorli connects everyone in one seamless platform built for your community.

No more calling shops one by one. No more driving across town for a plumber. No more phone tag to book a hall. Everything is one tap away.

---

## ✨ Core Features

### 🛒 Local Marketplace
Order groceries, medicine, bakery items, hardware, and more from every shop in your area. Real-time stock, instant checkout, and doorstep delivery.

### 🍽️ Food & Dining
Restaurants, cafes, home cooks, and cloud kitchens — browse menus, customise orders, track delivery live on a map.

### 🏨 Hotels & Rooms
Book hotels, guesthouses, holiday villas, and rooms. See real availability, instant confirmation, no phone calls needed.

### 🎉 Halls & Event Venues
Wedding halls, banquet rooms, conference centres, outdoor grounds — browse, compare, and book for any occasion.

### 📋 Event Planning
Build a complete event package in one place — venue, catering, decoration, photography, entertainment. Manage everything from one dashboard.

### 🔧 Home Services
Need a plumber, electrician, AC technician, carpenter, or cleaner? Post a request and get a verified professional at your door fast.

### 🚗 Delivery & Transport
Real-time driver tracking, live order updates, transparent delivery fees. Every order tracked from shop to door.

### 💈 Beauty & Wellness
Salons, barbershops, spas, clinics — book time slots without phone calls.

---

## 👥 Who is Doorli For?

**Customers** — residents who want everything local delivered or booked without hassle.

**Shop & Restaurant Owners** — go digital instantly, receive orders, manage stock, and grow sales.

**Hotels & Hall Owners** — get discovered, manage bookings, accept deposits online.

**Home Service Professionals** — plumbers, electricians, cleaners — receive job requests near you and earn more.

**Delivery Drivers & Riders** — earn flexibly by accepting deliveries in your area.

**Event Planners** — coordinate vendors, budgets, and timelines all in one place.

---

## 🌍 The Problem We Solve

| Problem | How Doorli Fixes It |
|---|---|
| Housewives can't order from small local shops online | Every shop lists products — order and get delivery |
| Finding a plumber urgently takes hours | Post a request, get a verified pro in minutes |
| Booking a wedding hall requires many phone calls | Browse, check availability, book and pay instantly |
| Local shops have no digital presence | Free onboarding — be online in under 10 minutes |
| No single app covers daily local needs | One login, one wallet, everything in one place |
| Delivery doesn't exist for small shops | Built-in driver network handles every delivery |

---

## 🏛️ Architecture Strategy

### MVP Architecture (Months 1–4) — Build This First

```
Monorepo → Modular services → REST + WebSocket → PostgreSQL + Redis
```

| Layer | Technology | Notes |
|---|---|---|
| Customer / Vendor / Driver Mobile | React Native + Expo | Single codebase, Expo Router |
| Customer Web | Next.js 14 (App Router) | SSR + SEO |
| Vendor Dashboard + Admin | Next.js 14 + shadcn/ui | Desktop order & platform control |
| API Gateway | Nginx + Node.js | Rate limiting, routing |
| Main API | Node.js + Express + TypeScript | Auth, orders, bookings, vendors |
| Delivery Service | Node.js + Redis + PostGIS | Driver dispatch, live tracking |
| Notification Service | Node.js + Firebase + MSG91 | Push, SMS, email |
| Database | PostgreSQL 16 + PostGIS + Prisma | Transactional + geospatial |
| Cache / Queue | Redis 7 + BullMQ | Sessions, jobs, pub/sub |
| Real-time | Socket.io + Redis PubSub | Order & driver tracking |
| Search | Elasticsearch 8 | Product & vendor search (Phase 2) |
| Payments | Stripe + PayHere | Cards + LKR local methods |
| Storage | AWS S3 / DigitalOcean Spaces | Images, PDFs |
| DevOps | Docker Compose → Kubernetes | CI/CD via GitHub Actions |

### Enterprise Evolution (Months 10+) — From ESAD

As scale grows toward 100M users, evolve incrementally:

| Capability | MVP | Enterprise Target |
|---|---|---|
| Architecture | Modular monorepo services | 40+ domain microservices, CQRS + Event Sourcing |
| Mobile | React Native + Expo | Optional native Kotlin/Swift for performance-critical paths |
| Databases | PostgreSQL + Redis | Polyglot: + MongoDB, DynamoDB, ClickHouse, Neo4j |
| APIs | REST + WebSocket | + GraphQL (complex queries), gRPC (internal) |
| Cloud | Single region (AWS) | Multi-region active-active (AWS primary, Azure DR, GCP analytics) |
| Security | JWT + OTP + Zod | Zero-trust, OAuth 2.0/OIDC, mTLS, ISO 27001 / SOC 2 / PCI DSS |
| Observability | Sentry + basic metrics | OpenTelemetry + Prometheus + Grafana + Jaeger + ELK |
| CI/CD | GitHub Actions | GitOps with ArgoCD + Terraform IaC |
| Extra domains | — | Community forums, government services, emergency SOS alerts |

---

## 🧩 Eight Core Modules

### Module 1 — Local Marketplace (Grocery & Retail)
Shops list products with photos, price, stock, and unit. Customers browse, cart, checkout with delivery or pickup. Vendors manage orders (pending → preparing → ready). Auto out-of-stock, bulk packs, group orders, substitution requests.

**Tables:** `vendors`, `products`, `orders`, `order_items`, `addresses`

### Module 2 — Food & Restaurant Ordering
Menu builder with categories, add-ons, allergen tags. Operating hours auto-close. Prep time estimates, table reservations, scheduled orders, combo deals, kitchen display board.

**Tables:** `vendors`, `products`, `orders`, `order_items`, `bookings`

### Module 3 — Hotels, Rooms & Accommodation
Property listings with availability calendar, instant vs request booking, multi-room, seasonal pricing, amenities filter, deposit handling, post-stay reviews.

**Tables:** `vendors`, `bookings`, `reviews`, `payments`

### Module 4 — Hall & Event Venue Booking
Capacity, slot-based booking (morning/afternoon/full-day), pricing tiers, package builder, floor plans, deposit/cancellation policy, contract PDF generation, enquiry system.

**Tables:** `vendors`, `bookings`, `payments`

### Module 5 — Event Planning & Coordination
Step-by-step wizard (date → venue → catering → decor → photo → transport). Bundle booking under one event reference, budget tracker, checklist, guest list, vendor group chat, consolidated invoice.

**Tables:** `bookings`, `vendors`, `orders`, `payments`

### Module 6 — Home Services
Plumbing, electrical, AC, carpentry, painting, cleaning, CCTV, pest control. Urgent mode, radius-based matching, provider profiles, price negotiation, arrival tracking, dispute system.

**Tables:** `service_requests`, `users`, `reviews`, `payments`

### Module 7 — Transport & Delivery Engine *(Critical Path)*
Last-mile delivery for all order types. PostGIS driver queries, 30-second accept timer, 5-second location broadcast, radius expansion after 3 min.

**Delivery fee:** `Base Fee + (Distance km × Per-km Rate) + Peak Surcharge`  
**Example:** LKR 50 base + 3 km × LKR 25 = **LKR 125**

### Module 8 — Beauty, Health & Wellness
Salons, barbers, spas, clinics — time-slot appointments without phone calls.

**Tables:** `vendors`, `bookings`

---

## 👥 Three User Apps

| App | Key Screens & Features |
|---|---|
| **Customer** | OTP login, category home feed, universal search, multi-vendor cart, checkout, live driver map, bookings, reviews, loyalty points |
| **Vendor** | Order dashboard, menu/product manager, inventory alerts, booking calendar, analytics, payout history, promotions |
| **Driver / Provider** | Go online toggle, job popup (30s timer), navigation, earnings tracker, document upload, delivery OTP confirmation |

---

## 🗄️ Database Schema (Core Tables)

All relational data in **PostgreSQL 16** with **PostGIS** for geospatial queries. Managed via **Prisma ORM**.

| Table | Key Fields |
|---|---|
| `users` | id, full_name, phone (unique), email, role (customer/vendor/driver/admin), is_verified |
| `addresses` | user_id, label, address_line, lat/lng, is_default |
| `vendors` | business_name, category (grocery/restaurant/hotel/hall/service/beauty), opening_hours (JSONB), delivery_radius_km, min_order_amount |
| `products` | vendor_id, name, price, discount_price, unit, stock_quantity, is_available |
| `orders` | order_number, customer_id, vendor_id, driver_id, status flow, payment_method, payment_status |
| `order_items` | order_id, product_id, quantity, unit_price, total_price |
| `bookings` | booking_type (hotel/hall/beauty/service), check_in/out dates, event_date, guest_count, deposit_amount, status |
| `service_requests` | service_type, title, is_urgent, offered_rate, assigned_provider_id, status |
| `drivers` | vehicle_type, is_online, current lat/lng (PostGIS GEOGRAPHY), earnings_today |
| `reviews` | reviewer_id, vendor_id, rating (1–5), comment, photos (JSONB) |
| `payments` | reference_id, reference_type, amount, gateway (stripe/payhere), status |
| `notifications` | user_id, title, body, type, data (JSONB), is_read |

**PostGIS driver query example:**
```sql
ALTER TABLE drivers ADD COLUMN location GEOGRAPHY(POINT, 4326);
CREATE INDEX idx_driver_location ON drivers USING GIST(location);
SELECT * FROM drivers WHERE is_online = true
  AND ST_DWithin(location, ST_MakePoint(lng, lat)::geography, 5000);
```

---

## 📦 API & Real-Time Events

**Base URLs:**
- Production: `https://api.doorli.app/api/v1/`
- Staging: `https://staging-api.doorli.app/api/v1/`
- WebSocket: `wss://api.doorli.app/ws`
- Admin: `https://api.doorli.app/admin/v1/`

| Service | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/verify-phone` |
| Users | `GET/PATCH /users/me`, `POST/GET/DELETE /users/addresses` |
| Vendors | `GET /vendors`, `/vendors/nearby?lat=&lng=&radius=`, `POST /vendors` |
| Products | CRUD + `PATCH /products/:id/toggle-available`, bulk stock update |
| Orders | `POST /orders`, `PATCH /orders/:id/status`, `GET /orders/:id/track` |
| Bookings | `POST /bookings`, status updates, vendor/customer views |
| Services | `POST /service-requests`, `/nearby`, accept/complete flows |
| Drivers | go-online/offline, update-location, accept-delivery, earnings |
| Payments | initiate, webhook, refund |
| Search | `GET /search?q=&category=&lat=&lng=&sort=` |
| Reviews | create, list by vendor, delete |

**WebSocket events:**

| Event | Direction | Payload |
|---|---|---|
| `order:status_update` | Server → Client | orderId, newStatus, timestamp |
| `driver:location_update` | Server → Client | driverId, lat, lng, heading |
| `order:new_order` | Server → Vendor | Full order object |
| `driver:new_job` | Server → Driver | orderId, pickup/dropoff coords |
| `service:new_request` | Server → Provider | requestId, type, distance, rate |
| `notification:new` | Server → Client | title, body, type, data |

Full API documentation at `/api/docs` (Swagger / OpenAPI 3.0).

---

## 🗂️ Project Structure

```
doorli/
├── apps/
│   ├── web/               # Next.js customer web app
│   ├── vendor-web/        # Next.js vendor dashboard
│   ├── admin/             # Admin panel
│   └── mobile/            # React Native (Expo) — customer + vendor + driver
├── services/
│   ├── api/               # Main Express API (auth, orders, bookings)
│   ├── delivery/          # Delivery dispatch microservice
│   └── notifications/     # Push + SMS + email service
├── packages/
│   ├── db/                # Prisma schema + generated client
│   ├── types/             # Shared TypeScript interfaces
│   └── utils/             # Shared utility functions
├── docker-compose.yml
├── turbo.json
└── README.md
```

**Mobile app routes (Expo Router):**
```
app/(auth)/login.tsx
app/(customer)/index.tsx | search.tsx | cart.tsx | checkout.tsx | track/[orderId].tsx
app/(vendor)/orders.tsx | menu.tsx
app/(driver)/jobs.tsx | navigate/[orderId].tsx
```

---

## 🗺️ Implementation Plan

### Phase 1 — MVP Launch (Months 1–4)

**Goal:** Grocery ordering + food delivery + basic transport in **one neighbourhood**.  
**Soft launch target:** 20 shops, 15 drivers.

| Week | Tasks |
|---|---|
| 1–2 | Monorepo setup, Git, CI/CD pipeline, Docker dev environment |
| 3–4 | Auth service — phone OTP (MSG91), JWT, registration for all roles |
| 5–6 | Vendor onboarding — shop registration, product listing, basic dashboard |
| 7–8 | Customer app core — home screen, vendor listing, product browsing |
| 9–10 | Order service — cart, checkout, order creation, status flow |
| 11–12 | Driver app — go online, job acceptance, basic navigation |
| 13–14 | Payment integration — COD + one card gateway (Stripe/PayHere) |
| 15–16 | Push notifications for order events; soft launch |

**Phase 1 deliverables:**
- [ ] Customer iOS + Android app
- [ ] Vendor mobile app
- [ ] Driver app
- [ ] Basic vendor web dashboard
- [ ] Payment processing (COD + card)
- [ ] Live order tracking

---

### Phase 2 — Full Platform (Months 5–9)

**Goal:** All 8 modules live across multiple vendor categories.

| Month | Tasks |
|---|---|
| 5 | Restaurant module (menu builder, prep time, kitchen display); Hotel booking (availability calendar) |
| 6 | Hall booking (slot booking, deposit, contract PDF); Home services (urgent jobs, provider matching) |
| 7 | Event planning wizard (multi-vendor bundling); Beauty & wellness time-slot bookings |
| 8 | Admin panel (vendor verification, analytics); Review and rating system |
| 9 | Elasticsearch advanced search; Promotions (discount codes, flash sales, featured listings) |

**Phase 2 deliverables:**
- [ ] All 8 modules live
- [ ] Admin dashboard
- [ ] Review system
- [ ] Advanced search
- [ ] Promo engine
- [ ] Full vendor web dashboard

---

### Phase 3 — Scale & Intelligence (Months 10+)

**Goal:** Multi-city expansion, AI features, loyalty, enterprise tools.

| Month | Tasks |
|---|---|
| 10 | Multi-city support; Loyalty points system |
| 11 | AI recommendations (personalized home feed); Group orders |
| 12 | Scheduled/subscription deliveries; Vendor revenue forecasting |
| 13+ | White-label licensing; Enterprise accounts; In-app advertising |
| Ongoing | Performance optimization, load testing, security audits |

**Phase 3 deliverables:**
- [ ] Multi-city deployment
- [ ] AI-powered feed
- [ ] Loyalty program
- [ ] Subscription orders
- [ ] Enterprise accounts
- [ ] Platform analytics (ClickHouse)

---

### Enterprise Roadmap (Year 1–3) — From ESAD

Longer-term milestones aligned with the enterprise architecture document:

| Phase | Timeline | Focus | Success Criteria |
|---|---|---|---|
| Foundation | Months 1–3 | Infrastructure, auth, search, basic profiles | 100 test users, 50 test businesses, 99% uptime |
| Core Features | Months 4–6 | Orders, events, forum, payments, mobile beta | 1,000 users, 100 businesses, 50 orders/day |
| Growth & Scale | Months 7–9 | Government services, emergency SOS, ML, multi-city | 10,000 users, 500 businesses, < 200ms p95 |
| Enterprise | Months 10–12 | Partner API, white-label, international, compliance | 50,000 users, 2,000 businesses, revenue positive |

**Geographic expansion:**
- Year 1: Single region (Singapore) serving Sri Lanka market
- Year 2: Secondary region (Sydney) for DR + read replicas
- Year 3: Regional deployment (India, Bangladesh, Nepal, Maldives)
- Year 5: Global (Asia-Pacific, Middle East, Africa)

---

## 🤖 AI Agent Build Guide

Structured prompts for Cursor / Claude Code to build from scratch:

**1. Project initialization**
```
Stack: Node.js + Express + TypeScript, Next.js 14, React Native + Expo,
PostgreSQL 16 + Prisma, Redis 7, Socket.io. Create monorepo with apps/,
services/, packages/ structure as defined in README.
```

**2. Database schema** — Create Prisma models: User, Address, Vendor, Product, Order, OrderItem, Booking, ServiceRequest, Driver, Review, Payment, Notification, LoyaltyPoint. Enable PostGIS. Run `npx prisma migrate dev --name init`.

**3. Auth service** — Phone OTP via MSG91, JWT access + refresh tokens in Redis, role guards (`customer | vendor | driver | admin`), 5-minute OTP TTL.

**4. Order service** — Validate cart, calculate delivery fee, create order + items, emit `order:new_order` via Socket.io, trigger delivery dispatch on confirmation. State machine: vendor (pending→confirmed→preparing→ready), driver (ready→picked_up→delivered), customer (cancel within 2 min).

**5. Delivery dispatch** — PostGIS query within 5 km, 30-second accept timer, expand to 10 km after 3 failed attempts, broadcast location every 5 seconds.

**6. Security checklist** — Zod validation, rate limiting (100 req/15min auth, 500 req/15min API), Helmet.js, CORS whitelist, webhook signature verification, Prisma-only queries (no raw SQL interpolation).

---

## ✅ Testing & Launch Checklist

**Backend**
- [ ] All endpoints return correct HTTP status codes
- [ ] JWT expiry and refresh flow tested
- [ ] Order state machine — all valid and invalid transitions
- [ ] Payment webhooks tested (Stripe test events)
- [ ] Delivery dispatch tested with mock driver locations
- [ ] Rate limiting verified; sensitive fields never in API responses

**Mobile**
- [ ] OTP login on iOS and Android
- [ ] Push notifications in background
- [ ] Live tracking map updates every ~5 seconds
- [ ] Cart persists across restarts (AsyncStorage)
- [ ] Deep links from notifications navigate correctly

**Performance targets**
- [ ] API p95 < 200ms under load
- [ ] WebSocket supports 1,000+ concurrent connections
- [ ] Elasticsearch search < 100ms (Phase 2)
- [ ] Mobile initial load < 3s on 4G
- [ ] Images served via CDN as WebP

**Pre-launch**
- [ ] App Store + Google Play approval
- [ ] Domain, SSL, Cloudflare configured
- [ ] Production DB backup + restore tested
- [ ] Monitoring alerts for downtime and error spikes
- [ ] 20+ vendors onboarded and verified
- [ ] 15+ drivers registered and trained
- [ ] Payment gateway live keys tested with real transaction

---

## 🏗️ Tech Stack (Full Reference)

| Layer | Technology |
|---|---|
| Mobile App | React Native + Expo (iOS & Android) |
| Web App | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| State Management | Zustand + React Query |
| Backend | Node.js v20 + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 16 + PostGIS |
| Cache & Queues | Redis 7 + BullMQ |
| Real-time | Socket.io + Redis PubSub |
| Search | Elasticsearch 8 |
| Payments | Stripe + PayHere (LKR) |
| Maps & Tracking | Google Maps Platform |
| Notifications | Firebase Cloud Messaging + MSG91 SMS |
| Email | SendGrid / AWS SES |
| File Storage | AWS S3 / DigitalOcean Spaces |
| CDN | Cloudflare |
| Monitoring | Prometheus + Grafana + Sentry |
| Testing | Jest + Supertest + Cypress |
| DevOps | Docker + Kubernetes + GitHub Actions |

---

## 💰 Revenue Model

| Stream | How It Works | Target Rate |
|---|---|---|
| Order Commission | % of each order total | 8–15% per order |
| Vendor Subscription | Monthly listing fee | LKR 2,000–8,000/mo |
| Delivery Fee | Per-km charge to customer | LKR 30–150/order |
| Featured Listings | Top-of-results placement | LKR 500–2,000/week |
| Premium Customer Plan | Unlimited free delivery + priority support | LKR 1,500/month |
| Event Booking Fee | Hall and hotel bookings | 3–5% of booking |
| Home Service Cut | Platform fee on service jobs | 10% of job value |
| In-app Promotions | Sponsored banners and content | Fixed packages |

---

## 🔐 Security

- JWT authentication with refresh token rotation (Redis-backed blacklist)
- Phone number OTP verification via MSG91
- Input validation with Zod on all endpoints
- Rate limiting: 100 req/15min (auth), 500 req/15min (API)
- HTTPS enforced in production; Helmet.js security headers
- Stripe / PayHere PCI-compliant payment handling
- Webhook signature verification
- Role-based access control (customer / vendor / driver / admin)
- File upload: MIME type + 5 MB size limit before S3 upload

**Enterprise security targets (ESAD):** Zero-trust architecture, OAuth 2.0/OIDC, mTLS, ISO 27001, SOC 2 Type II, PCI DSS Level 1, quarterly penetration testing.

---

## 🚀 Getting Started

### Git Author (this repo)

All commits in this repository use:

```
AHSAN MOHAMMED <ahsanmohammed828@gmail.com>
```

Local git config is set for this project. To use the same identity globally on your machine:

```bash
git config --global user.name "AHSAN MOHAMMED"
git config --global user.email "ahsanmohammed828@gmail.com"
```

### Prerequisites

- Node.js v20+
- PostgreSQL 16 (with PostGIS extension)
- Redis 7
- Docker (recommended)

### Quick Start (Week 1–2 Foundation)

```bash
# Clone the repository
git clone https://github.com/ahsanmohammed828/doorli.git
cd doorli

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL + PostGIS and Redis
docker compose up -d

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate:deploy

# Seed sample data (2 vendors, 10 products, test users)
npm run db:seed

# Start all dev servers (API :4000, vendor-web :3000, Expo :8081)
npm run dev
```

**Verify the setup:**

```bash
curl http://localhost:4000/health
# Expected: { "status": "ok", "db": true, "redis": true, ... }

curl http://localhost:4000/api/v1
# Expected: { "success": true, "data": { "name": "Doorli API", ... } }
```

Open `http://localhost:3000` for the vendor dashboard placeholder.  
Open Expo DevTools (from `npm run dev`) for the mobile app placeholder.

**Monorepo structure:**

| Path | Purpose |
|---|---|
| `services/api` | Express API — auth, orders, bookings (Week 3+) |
| `services/delivery` | Driver dispatch stub (Week 11+) |
| `services/notifications` | Push/SMS stub (Week 15+) |
| `apps/mobile` | Expo app — customer, vendor, driver |
| `apps/vendor-web` | Next.js vendor dashboard |
| `packages/db` | Prisma schema + migrations |
| `packages/types` | Shared TypeScript types |
| `packages/utils` | Shared helpers |

### Installation (legacy reference)

```bash
# Run database migrations (interactive dev)
npm run db:migrate
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/doorli

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Payments
STRIPE_SECRET_KEY=your_stripe_key
PAYHERE_MERCHANT_ID=your_payhere_id

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key

# SMS (OTP)
MSG91_API_KEY=your_msg91_key

# File Storage
AWS_S3_BUCKET=doorli-media
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

---

## 🤝 Contributing

We welcome contributions from developers, designers, and local business enthusiasts.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📞 Contact & Support

- **Author:** AHSAN MOHAMMED
- **Email:** [ahsanmohammed828@gmail.com](mailto:ahsanmohammed828@gmail.com)

---

## 🏢 About Doorli

Doorli was born from one simple observation: the best businesses in any community are the small, local ones — but they are the hardest to find and order from online.

We are building the infrastructure that lets every corner shop, every family restaurant, every skilled tradesperson, and every event venue compete in the digital world — not by replacing them, but by connecting them to the customers who are already looking for exactly what they offer.

Our mission is to make local life frictionless. To make the person who needs groceries at 8pm able to get them without leaving home. To make the young couple planning their wedding able to compare halls and book caterers on a Sunday morning. To make the homeowner with a burst pipe able to find a trusted plumber in minutes, not hours.

Doorli is not just an app. It is the digital heart of your local community.

---

*Built with ❤️ for local communities everywhere.*
