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

## 🏛️ Unified Enterprise Architecture

Doorli is a community super-app platform designed to serve **100 Million Users** (10M DAU) by connecting local commerce, community forums, government services (GovTech), emergency dispatch/SOS networks, and transportation systems into one unified ecosystem. 

The architecture is built on a **multi-cloud, event-driven microservices monorepo**, integrated with a **multi-tenant enterprise SaaS ERP** back-office.

### The Ecosystem Split

The system is split into two primary components:
1. **Marketplace & Citizen Portal**: 40+ microservices (Node.js), mobile apps (React Native), PostGIS Geo-Tracking, and Kafka event streaming.
2. **Business SaaS (ERP)**: A complete multi-tenant ERP (Next.js + Drizzle ORM + PostgreSQL) for POS, Accounting, HR, Inventory, and Dealership management.

```text
                               [ THE DOORLI ECOSYSTEM ]
                                          │
         ┌────────────────────────────────┴────────────────────────────────┐
         ▼                                                                 ▼
 ┌────────────────────────────────┐                              ┌──────────────────┐
 │     MARKETPLACE & CITIZEN      │                              │  BUSINESS SAAS   │
 │         (Marketplace)          │                              │      (ERP)       │
 ├────────────────────────────────┤                              ├──────────────────┤
 │ • 40+ Microservices            │                              │ • Next.js Web    │
 │ • React Native Expo Apps       │ <==== [ INTEGRATION BRIDGES ] ===>│ • 180+ Tables    │
 │ • PostGIS Geo-Tracking         │   (Stock, Sales, Bookings)   │ • POS / Payments │
 │ • Emergency Alert & SOS        │                              │ • HR / Payroll   │
 │ • GovTech Directories          │                              │ • Accounting     │
 └────────────────────────────────┘                              └──────────────────┘
```

### Unified Technical Stack

| Component | Technology | Target Port | Status |
|-----------|------------|-------------|--------|
| **API Gateway** | Express Router / Kong Gateway | `4000` | Implemented |
| **Marketplace Core** | Node.js (TypeScript) & Express | — | Implemented |
| **Ride-Hailing Engine** | Express + Socket.io | `8085` | Implemented |
| **SaaS ERP System** | Next.js 14 (App Router) | `3000` | Implemented |
| **Databases** | PostgreSQL 16 (PostGIS) / Supabase DB | `5432` | Implemented |
| **Cache & Realtime** | Redis 7 / Socket.io | `6379` | Implemented |
| **Event Bus** | Apache Kafka & Zookeeper | `9092` / `2181` | Implemented |
| **Search Engine** | Elasticsearch 8 | — | Implemented |
| **Storage** | MinIO (S3 Compatible) | `9000` | Implemented |
| **Mobile Apps** | React Native + Expo (Zustand + React Query) | — | Implemented |

### Complete Microservice Catalog (40+ Services)

**Commerce & Marketplace Domain**
- `catalog`, `inventory`, `order`, `payment`, `cart`, `delivery`, `ride-hail`, `seller`, `auction`, `buyer-protection`

**Community, Forums & GovTech Domain**
- `forum`, `moderation`, `reputation`, `gov-tech`, `tax`, `license`, `complaint`, `document-vault`, `consultation`

**Emergency, Security & Shared Domain**
- `alert`, `incident`, `dispatch`, `safety-map`, `sos`, `volunteer`, `auth`, `kyc`, `rbac`, `ai`

### Integration Bridges (Marketplace ↔ ERP)

1. **Inventory Sync Bridge**: Marketplace vendors update catalog products according to ERP warehouse levels.
2. **Transaction Sync Bridge**: Marketplace orders are recorded as POS sales within the vendor's ERP.
3. **Scheduling Sync Bridge**: Marketplace hotel, hall, or home service bookings reserve calendar slots in the ERP.

---

## 🧩 Eight Core Modules

### Module 1 — Local Marketplace (Grocery & Retail)
Allows any local shop — grocery stores, supermarkets, pharmacies, bakeries, hardware shops — to list products and receive delivery orders.

**Key Features:**
- Shop onboarding: vendor registers, adds products with photos, price, stock, unit
- Product categories: grocery, vegetables, fruits, dairy, bakery, household items, medicine
- Customer browsing: search by shop name, product name, or category; filter by distance
- Cart system: add from multiple shops, see per-shop minimum order requirement
- Order placement: choose delivery address, time slot (ASAP or scheduled), payment method
- Order management for vendor: dashboard shows pending, preparing, ready tabs
- Stock management: auto mark out-of-stock when quantity hits zero
- Bulk ordering: vendors offer discounted bulk packs for pre-orders
- Group orders: multiple customers in same area combine order to share delivery cost
- Substitution requests: vendor can suggest alternative if item is unavailable

**Tables:** `vendors`, `products`, `orders`, `order_items`, `addresses`

**Key APIs:** `POST /orders`, `GET /vendors/nearby`, `GET /vendors/:id/products`

**App Screens:** Shop listing, Shop detail, Product search, Cart, Order status, Order history

### Module 2 — Food & Restaurant Ordering
Restaurants, cafes, cloud kitchens, and home cooks list menus and receive food delivery or dine-in pre-orders.

**Key Features:**
- Menu builder: categories (starters, mains, desserts, drinks) with photos and prices
- Item customization: add-ons, remove ingredients, size options with price difference
- Operating hours: auto-close ordering outside restaurant hours
- Estimated prep time: vendor sets time per order, shown to customer before checkout
- Table reservation: dine-in booking with date, time, and guest count
- Scheduled ordering: order tonight for tomorrow morning breakfast delivery
- Combo deals: create meal combos at bundle price
- Live order board: kitchen display showing incoming orders in preparation queue
- Allergen tagging: mark items as contains nuts, dairy, gluten, etc.
- Popular & recommended: algorithm highlights top-ordered items

**Tables:** `vendors`, `products`, `orders`, `order_items`, `bookings`

**Key APIs:** `POST /orders`, `GET /vendors?category=restaurant`, `PATCH /orders/:id/status`

**App Screens:** Restaurant listing, Menu view, Item customizer, Cart, Tracking map, Review screen

### Module 3 — Hotels, Rooms & Accommodation
Hotels, guesthouses, holiday villas, and individual room owners list their properties for direct booking.

**Key Features:**
- Property listing: room types, photos, amenities, check-in rules, price per night
- Availability calendar: owner marks blocked dates; customers see real-time availability
- Instant vs request booking: owner chooses instant confirm or manual approval
- Multi-room booking: book multiple rooms for group stays
- Price rules: weekday vs weekend pricing, seasonal rates, long-stay discounts
- Photo gallery: up to 20 property and room photos with captions
- Amenities filter: WiFi, parking, AC, pool, breakfast included, etc.
- Check-in instructions: owner sends digital check-in guide after confirmation
- Deposit handling: partial deposit at booking, remainder at check-in
- Review system: post-stay reviews with star ratings per category

**Tables:** `vendors`, `bookings`, `reviews`, `payments`

**Key APIs:** `POST /bookings`, `GET /vendors?category=hotel`, `GET /vendors/:id/availability`

**App Screens:** Hotel search, Property detail, Room selector, Date picker, Booking confirm, My bookings

### Module 4 — Hall & Event Venue Booking
Wedding halls, banquet rooms, function halls, outdoor grounds, and conference rooms list their spaces for event bookings.

**Key Features:**
- Venue listing: capacity, dimensions, setup options, catering policy, parking
- Slot-based booking: morning, afternoon, full-day, multi-day blocks
- Pricing tiers: weekday vs weekend, peak season surcharge
- Package builder: venue + catering + decoration as a bundled price
- Floor plan viewer: show hall layout options (banquet, theatre, classroom)
- Deposit and cancellation policy: configurable per venue
- Contract generation: auto-generate booking agreement PDF on confirmation
- Enquiry system: customers send enquiry with requirements before booking
- Vendor add-ons: suggest linked decorators, caterers, photographers on booking
- Dashboard: calendar view of bookings, revenue chart, pending enquiries

**Tables:** `vendors`, `bookings`, `payments`

**Key APIs:** `POST /bookings`, `GET /vendors?category=hall`, `PATCH /bookings/:id/status`

**App Screens:** Hall search, Hall detail, Date/time picker, Package selector, Confirm & pay, Contract view

### Module 5 — Event Planning & Coordination
Customers plan complete events by selecting a venue, catering, decoration, photography, entertainment, and transport — all from within the app.

**Key Features:**
- Event wizard: step-by-step planner (date → venue → catering → decor → photo → transport)
- Vendor marketplace per category: compare caterers, decorators, photographers side by side
- Bundle booking: book all vendors under one event reference number
- Budget tracker: set event budget, see real-time spend as vendors are added
- Checklist tool: auto-generated to-do list with deadlines for event prep
- Guest list manager: add guests, track RSVPs, share event details via link
- Vendor coordination chat: group chat between customer and all event vendors
- Timeline builder: create hour-by-hour event runsheet
- Post-event invoice: consolidated bill for all vendors in one PDF
- Event templates: pre-built packages for common events (silver wedding, corporate dinner)

**Tables:** `bookings`, `vendors`, `orders`, `payments`

**Key APIs:** `POST /bookings` (multi), `GET /vendors?category=event_service`, `GET /events/:id/summary`

**App Screens:** Event wizard, Vendor comparison, Budget tracker, Checklist, Guest manager, Event summary

### Module 6 — Home Services
Customers find and book verified plumbers, electricians, AC technicians, carpenters, painters, cleaners, CCTV installers, and other skilled tradespeople.

**Key Features:**
- Service categories: plumbing, electrical, AC & appliance, carpentry, painting, cleaning, CCTV, pest control, roofing
- Urgency mode: mark request as urgent, offer higher rate for immediate response
- Location-based matching: only providers within customer's radius receive the request
- Provider profiles: photo, skills, years of experience, certifications, reviews, hourly rate
- Job request flow: customer posts job → nearby providers notified → first to accept gets job
- Price negotiation: customer sets budget, provider can counter-offer before accepting
- Arrival tracking: like driver tracking, customer sees provider's location when en-route
- Job completion: provider marks done → customer confirms → payment released
- Dispute system: customer can raise dispute with photo evidence if job unsatisfactory
- Provider earnings dashboard: daily, weekly, monthly earnings and job history

**Tables:** `service_requests`, `users` (providers), `reviews`, `payments`

**Key APIs:** `POST /service-requests`, `GET /service-requests/nearby`, `PATCH /service-requests/:id/accept`

**App Screens:** Service category screen, Post a request, Provider list, Provider profile, Tracking, Review

### Module 7 — Transport & Delivery Engine *(Critical Path)*
The delivery engine is the most critical component. It handles last-mile delivery for all order types and also provides ride and cargo transport.

**Delivery Flow:**
1. Customer places order and selects delivery
2. Order Service creates order and emits `order:new_order` event
3. Delivery Service finds online drivers within radius using PostGIS geospatial query
4. Nearest available driver receives push notification and in-app alert
5. Driver accepts → status changes to 'assigned'
6. Driver arrives at vendor, picks up order → status 'picked_up'
7. Driver navigates to customer address via Google Maps API
8. Real-time location broadcast every 5 seconds via Socket.io to customer app
9. Driver marks delivered → customer confirms → payment settled → reviews unlocked
10. If no driver accepts within 3 min, request expands to 10km radius

**Driver App Core Screens:**
- Go online/offline toggle with earnings summary
- Incoming job request with accept/decline (30-second timer)
- Navigation screen with embedded Google Maps
- Order detail (pickup notes, customer contact)
- Earnings history (today, week, month)
- Profile and vehicle documents

**Delivery Fee Calculation:**
`Fee = Base Fee + (Distance in km × Per-km Rate) + Peak Hour Surcharge`
**Example:** Base = LKR 50, Rate = LKR 25/km, Distance = 3km → Fee = LKR 125

**Database: PostGIS for Location Queries:**
```sql
ALTER TABLE drivers ADD COLUMN location GEOGRAPHY(POINT, 4326);
CREATE INDEX idx_driver_location ON drivers USING GIST(location);
-- Find drivers within 5km:
SELECT * FROM drivers WHERE is_online=true 
  AND ST_DWithin(location, ST_MakePoint(lng,lat)::geography, 5000);
```

### Module 8 — Beauty, Health & Wellness
Salons, barbers, spas, clinics — time-slot appointments without phone calls.

**Key Features:**
- Service listing: haircut, facial, massage, manicure, pedicure, spa treatments
- Time-slot booking: select date and available time slots
- Provider profiles: stylists, therapists with specialties and ratings
- Service duration: automatic time slot blocking based on service length
- Appointment reminders: SMS and push notifications before appointments
- Service menu with photos and pricing
- Package deals: bundle multiple services at discount
- Review system: rate specific providers after service

**Tables:** `vendors`, `bookings`

**Key APIs:** `POST /bookings`, `GET /vendors?category=beauty`, `GET /vendors/:id/slots`

**App Screens:** Salon listing, Service menu, Time slot picker, Booking confirm, My appointments

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

### Core API Endpoints

**Auth**
- `POST /auth/register` — Register new user
- `POST /auth/login` — Login with phone/password
- `POST /auth/refresh` — Refresh access token
- `POST /auth/logout` — Logout and blacklist token
- `POST /auth/forgot-password` — Initiate password reset
- `POST /auth/verify-phone` — Verify phone with OTP

**Users**
- `GET /users/me` — Get current user profile
- `PATCH /users/me` — Update user profile
- `POST /users/addresses` — Add new address
- `GET /users/addresses` — List user addresses
- `DELETE /users/addresses/:id` — Delete address

**Vendors**
- `GET /vendors` — List all vendors
- `GET /vendors/:id` — Get vendor details
- `POST /vendors` — Create new vendor profile
- `PATCH /vendors/:id` — Update vendor profile
- `GET /vendors/nearby?lat=&lng=&radius=` — Find nearby vendors
- `GET /vendors/:id/products` — List vendor products
- `PATCH /vendors/:id/toggle-status` — Toggle online/offline

**Products**
- `POST /products` — Create new product
- `GET /products/:id` — Get product details
- `PATCH /products/:id` — Update product
- `DELETE /products/:id` — Delete product
- `PATCH /products/:id/toggle-available` — Toggle availability
- `POST /products/bulk-update-stock` — Bulk stock update

**Orders**
- `POST /orders` — Create new order
- `GET /orders/:id` — Get order details
- `PATCH /orders/:id/status` — Update order status
- `GET /orders/my-orders` — Get user's orders
- `GET /orders/vendor/:vendorId` — Get vendor's orders
- `POST /orders/:id/cancel` — Cancel order
- `GET /orders/:id/track` — Track order live

**Bookings**
- `POST /bookings` — Create new booking
- `GET /bookings/:id` — Get booking details
- `PATCH /bookings/:id/status` — Update booking status
- `GET /bookings/my-bookings` — Get user's bookings
- `GET /bookings/vendor/:vendorId` — Get vendor's bookings
- `DELETE /bookings/:id/cancel` — Cancel booking

**Services**
- `POST /service-requests` — Create service request
- `GET /service-requests/nearby` — Find nearby service requests
- `PATCH /service-requests/:id/accept` — Accept service request
- `PATCH /service-requests/:id/complete` — Mark service complete
- `GET /service-requests/my-jobs` — Get provider's jobs

**Drivers**
- `PATCH /drivers/go-online` — Set driver online
- `PATCH /drivers/go-offline` — Set driver offline
- `PATCH /drivers/update-location` — Update driver location
- `GET /drivers/available-jobs` — Get available jobs
- `PATCH /drivers/accept-delivery/:orderId` — Accept delivery
- `GET /drivers/earnings` — Get earnings history

**Payments**
- `POST /payments/initiate` — Initiate payment
- `POST /payments/webhook` — Payment gateway webhook
- `GET /payments/:id` — Get payment details
- `POST /payments/refund` — Refund payment

**Search**
- `GET /search?q=&category=&lat=&lng=&sort=` — Universal search
- `GET /search/suggestions` — Search suggestions

**Reviews**
- `POST /reviews` — Create review
- `GET /reviews/vendor/:vendorId` — Get vendor reviews
- `DELETE /reviews/:id` — Delete review

**Notifications**
- `GET /notifications` — Get user notifications
- `PATCH /notifications/:id/read` — Mark notification read
- `PATCH /notifications/read-all` — Mark all read

### WebSocket Events

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

**Detailed Task Breakdown:**

| Week | Tasks |
|---|---|
| 1–2 | Project setup — monorepo, Git, CI/CD pipeline, Docker dev environment |
| 3–4 | Auth service — phone OTP (MSG91), JWT, user registration for all roles |
| 5–6 | Vendor onboarding — shop registration, product listing, basic dashboard |
| 7–8 | Customer app core — home screen, vendor listing, product browsing |
| 9–10 | Order service — cart, checkout, order creation, order status flow |
| 11–12 | Driver app — go online, job acceptance, basic navigation |
| 13–14 | Payment integration — cash on delivery + one card payment gateway (Stripe/PayHere) |
| 15–16 | Push notifications for order events; soft launch with 20 shops, 15 drivers |

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

**Detailed Task Breakdown:**

| Month | Tasks |
|---|---|
| 5 | Restaurant module — menu builder, prep time, kitchen display; Hotel booking — availability calendar |
| 6 | Hall booking — slot booking, deposit, contract PDF; Home services — urgent jobs, provider matching |
| 7 | Event planning wizard — multi-vendor bundling; Beauty & wellness — time-slot bookings |
| 8 | Admin panel — vendor verification, analytics; Review and rating system |
| 9 | Elasticsearch advanced search; Promotions — discount codes, flash sales, featured listings |

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

**Detailed Task Breakdown:**

| Month | Tasks |
|---|---|
| 10 | Multi-city support — city selector, city-specific vendor pools; Loyalty points system |
| 11 | AI recommendations — personalized home feed; Group orders — neighbors combine orders |
| 12 | Scheduled/subscription deliveries — weekly grocery subscriptions; Vendor revenue forecasting |
| 13+ | White-label licensing — sell platform to other regions; Enterprise accounts — corporate plans |
| 14+ | In-app advertising — vendors pay to boost visibility; Platform analytics with ClickHouse |
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

### 1. Project Initialization Prompt

```
You are building LocalConnect, a community super-app. Stack: Node.js + Express + TypeScript (backend), Next.js 14 + TypeScript (web), React Native + Expo (mobile). Database: PostgreSQL 16 with Prisma ORM. Cache: Redis 7. Realtime: Socket.io. Create a monorepo with this structure:

/apps/web - Next.js customer web app
/apps/vendor-web - Next.js vendor dashboard
/apps/admin - Next.js admin panel
/apps/mobile - React Native (Expo) for customer, vendor, driver
/services/api - Main Express API
/services/delivery - Delivery dispatch microservice
/packages/db - Prisma schema + generated client
/packages/types - Shared TypeScript interfaces
/packages/utils - Shared utility functions

Root: package.json with workspaces, turbo.json for build pipeline.
```

### 2. Database Schema Prompt

Using the `/packages/db` workspace, create the Prisma schema file with these models:

**User, Address, Vendor, VendorCategory (enum), Product, Order, OrderItem, OrderStatus (enum), Booking, BookingType (enum), ServiceRequest, Driver, Review, Payment, Notification, LoyaltyPoint.**

Enable PostGIS extension in the migration for geospatial driver queries. Add all foreign key relations, indexes on frequently queried fields (vendor_id, customer_id, status, created_at). Run:

```bash
npx prisma migrate dev --name init
```

### 3. Auth Service Prompt

Build the authentication system in `/services/api/src/modules/auth/`:

- **Phone OTP flow:**
  - `POST /auth/send-otp` → send 6-digit code via MSG91 SMS API
  - `POST /auth/verify-otp` → verify code, create user if new, return JWT access token + refresh token
  - `POST /auth/refresh` → validate refresh token in Redis, return new access token
  - `POST /auth/logout` → blacklist refresh token in Redis
- **Middleware:** `authenticateToken.ts` → verify JWT, attach user to req.user
- **Role guard middleware:** `requireRole('vendor' | 'driver' | 'admin')`
- Use bcrypt for any password hashing. Store OTP codes in Redis with 5-minute TTL.

### 4. Order Service Prompt

Build the order module in `/services/api/src/modules/orders/`:

**POST /orders:**
1. Validate cart items against current product availability and prices
2. Calculate subtotal, delivery fee (Base + km × rate), any applied discount
3. Create Order record with status='pending'
4. Create OrderItem records for each cart item
5. Initiate payment if method != 'cod'
6. Emit Socket.io event 'order:new_order' to vendor room
7. Trigger delivery dispatch if order confirmed

**PATCH /orders/:id/status:**
- Vendor can update: pending→confirmed, confirmed→preparing, preparing→ready
- Driver can update: ready→picked_up, picked_up→delivered
- Customer can: pending→cancelled (within 2 min)
- Emit Socket.io event 'order:status_update' to customer room on each change

### 5. Delivery Dispatch Service Prompt

Build `/services/delivery/src/dispatch.ts`:

When an order is ready for pickup:
1. Query PostgreSQL with PostGIS: `SELECT drivers within 5km radius, is_online=true, not currently delivering`
2. Sort by distance ASC
3. Send job offer to nearest driver via Socket.io event 'driver:new_job'
4. Start 30-second Redis countdown timer for driver response
5. If driver accepts: update order.driver_id, emit status update to customer
6. If timer expires: try next nearest driver (expand radius to 10km after 3 failed attempts)
7. Update driver.current_order_id in Redis for load management

**Driver location updates:**
- Driver app emits 'driver:location' every 5 seconds with lat/lng
- Service stores in Redis: `SET driver:{id}:location '{"lat":..,"lng":..}' EX 30`
- Broadcasts to subscribed customer: 'order:{orderId}:driver_location'

### 6. React Native App Structure Prompt

In `/apps/mobile`, set up Expo Router for navigation:

```
app/(auth)/login.tsx - Phone input + OTP verification
app/(customer)/index.tsx - Home feed with categories
app/(customer)/search.tsx - Universal search
app/(customer)/cart.tsx - Cart management
app/(customer)/checkout.tsx - Address, time, payment selection
app/(customer)/track/[orderId].tsx - Live map tracking screen
app/(customer)/bookings.tsx - My bookings list
app/(vendor)/orders.tsx - Incoming orders
app/(vendor)/menu.tsx - Product management
app/(driver)/jobs.tsx - Available + active jobs
app/(driver)/navigate/[orderId].tsx - Turn-by-turn navigation
```

Use Zustand for auth state and cart state. Use React Query for all API calls with automatic retry and cache. Use react-native-maps for the tracking screen with animated driver marker. Use Expo Notifications for push notification handling.

### 7. Security Checklist Prompt

- All endpoints behind authenticateToken middleware except /auth/* routes
- Input validation using Zod on every request body and query param
- Rate limiting: 100 req/15min per IP on auth routes, 500 req/15min on API routes (Redis-backed)
- SQL injection prevention: use Prisma parameterized queries only, never raw string interpolation
- File upload validation: check MIME type + file size limit (5MB) before uploading to S3
- CORS: whitelist only known frontend domains
- Helmet.js: set security headers on all responses
- Sensitive env vars: store in .env, never commit — use GitHub Secrets in CI/CD
- Payment webhooks: verify Stripe/PayHere signature on every webhook request
- Admin routes: additional requireRole('admin') guard + IP whitelist option

---

## ✅ Testing & Launch Checklist

### Backend Testing
- [ ] All API endpoints return correct HTTP status codes
- [ ] JWT expiry and refresh flow tested
- [ ] Order state machine — all valid and invalid transitions
- [ ] Payment webhooks tested (Stripe test events)
- [ ] Delivery dispatch tested with mock driver locations
- [ ] Rate limiting verified; sensitive fields never in API responses
- [ ] Database indexes verified with EXPLAIN ANALYZE on slow queries
- [ ] All sensitive fields (password, card numbers) never returned in API responses

### Mobile App Testing
- [ ] OTP login on iOS and Android
- [ ] Push notifications in background
- [ ] Live tracking map updates every ~5 seconds
- [ ] Cart persists across restarts (AsyncStorage)
- [ ] Deep links from notifications navigate correctly
- [ ] Payment card input meets PCI DSS requirements (use Stripe SDK, never store raw)
- [ ] Camera permission for photo upload handled gracefully
- [ ] Offline state shows appropriate message

### Vendor Dashboard Testing
- [ ] Incoming order notification received within 3 seconds
- [ ] Order accept/reject works correctly
- [ ] Menu toggle (available/unavailable) reflects immediately in customer app
- [ ] Analytics charts load correctly with real data
- [ ] Payout history shows correct amounts after commission deduction

### Performance Targets
- [ ] API p95 < 200ms under load
- [ ] WebSocket supports 1,000+ concurrent connections
- [ ] Elasticsearch search < 100ms (Phase 2)
- [ ] Mobile initial load < 3s on 4G
- [ ] Images served via CDN as WebP

### Pre-Launch Checklist
- [ ] App Store + Google Play approval
- [ ] Domain, SSL, Cloudflare configured
- [ ] Production DB backup + restore tested
- [ ] Monitoring alerts for downtime and error spikes
- [ ] 20+ vendors onboarded and verified
- [ ] 15+ drivers registered and trained
- [ ] Payment gateway live keys tested with real transaction
- [ ] Support contact (WhatsApp/email) listed in app
- [ ] On-call plan defined for launch week

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
