# 🚪 Doorli
### Everything Local. Delivered.

> **Doorli** is a community super-app that connects every local business, service, and venue to every resident — groceries, food, hotels, wedding halls, home repairs, beauty, and more — all in one app with real-time delivery and live tracking.

---

## 📱 What is Doorli?

Doorli is the **one app your neighbourhood has always needed**.

Think of it as having the power of Talabat + Uber + Airbnb + UrbanClap — but built specifically for your local community. Whether you are a housewife ordering groceries, a family booking a wedding hall, a business owner listing your shop, or a driver looking to earn — Doorli connects everyone in one seamless platform.

No more calling shops one by one. No more driving across town for a plumber. No more phone tag to book a hall. Everything is one tap away.

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

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native + Expo (iOS & Android) |
| Web App | Next.js 14 (App Router) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 + PostGIS |
| Cache & Queues | Redis 7 + BullMQ |
| Real-time | Socket.io |
| Search | Elasticsearch 8 |
| Payments | Stripe + PayHere |
| Maps & Tracking | Google Maps Platform |
| Notifications | Firebase Cloud Messaging |
| File Storage | AWS S3 |
| DevOps | Docker + Kubernetes + GitHub Actions |

---

## 🗂️ Project Structure

```
doorli/
├── apps/
│   ├── web/               # Next.js customer web app
│   ├── vendor-web/        # Next.js vendor dashboard
│   ├── admin/             # Admin panel
│   └── mobile/            # React Native app (customer + vendor + driver)
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

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- PostgreSQL 16
- Redis 7
- Docker (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/doorli.git
cd doorli

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start all services with Docker
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Start development servers
npm run dev
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

## 📦 API Overview

| Service | Base Path | Description |
|---|---|---|
| Auth | `/api/v1/auth` | Login, register, OTP, refresh |
| Users | `/api/v1/users` | Profile, addresses |
| Vendors | `/api/v1/vendors` | Shop listing, nearby search |
| Products | `/api/v1/products` | Product CRUD, stock management |
| Orders | `/api/v1/orders` | Place, track, manage orders |
| Bookings | `/api/v1/bookings` | Hotels, halls, appointments |
| Services | `/api/v1/service-requests` | Home service job requests |
| Drivers | `/api/v1/drivers` | Driver status, earnings |
| Payments | `/api/v1/payments` | Initiate, webhook, refund |
| Search | `/api/v1/search` | Universal search across platform |

Full API documentation available at `/api/docs` (Swagger UI).

---

## 🗺️ Launch Roadmap

### ✅ Phase 1 — MVP (Months 1–4)
- [ ] Customer app — browse, order, track
- [ ] Vendor app — receive and manage orders
- [ ] Driver app — accept and deliver
- [ ] Grocery and food ordering
- [ ] Real-time delivery tracking
- [ ] Cash on delivery + card payment
- [ ] Soft launch in one neighbourhood

### 🔄 Phase 2 — Full Platform (Months 5–9)
- [ ] Hotel and room booking
- [ ] Hall and event venue booking
- [ ] Home services module
- [ ] Event planning wizard
- [ ] Beauty and wellness bookings
- [ ] Admin dashboard
- [ ] Review and rating system
- [ ] Promo codes and flash sales

### 🌐 Phase 3 — Scale (Month 10+)
- [ ] Multi-city expansion
- [ ] AI-powered recommendations
- [ ] Loyalty points program
- [ ] Scheduled and subscription deliveries
- [ ] Group ordering
- [ ] White-label licensing to other regions
- [ ] Enterprise and corporate accounts

---

## 💰 Revenue Model

| Stream | How It Works |
|---|---|
| Order Commission | 8–15% per completed order |
| Vendor Subscription | Monthly fee for shop listings |
| Delivery Fee | Per-km charge to customers |
| Featured Listings | Vendors pay to appear at top of results |
| Premium Membership | Customers pay for unlimited free delivery |
| Booking Fee | 3–5% cut on hotel and hall bookings |
| Home Service Cut | 10% of each service job value |

---

## 🔐 Security

- JWT authentication with refresh token rotation
- Phone number OTP verification via SMS
- Input validation with Zod on all endpoints
- Rate limiting on all API routes
- HTTPS enforced in production
- Stripe PCI-compliant payment handling
- Webhook signature verification
- Role-based access control (customer / vendor / driver / admin)

---

## 🤝 Contributing

We welcome contributions from developers, designers, and local business enthusiasts.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please read `CONTRIBUTING.md` for our code of conduct and contribution guidelines.

---

## 📄 License

This project is licensed under the MIT License — see the `LICENSE` file for details.

---

## 📞 Contact & Support

- **Website:** [doorli.app](https://doorli.app)
- **Email:** hello@doorli.app
- **Support:** support@doorli.app
- **Twitter / X:** [@doorliapp](https://twitter.com/doorliapp)
- **LinkedIn:** [Doorli](https://linkedin.com/company/doorli)

---

## 🌟 App Store Description

**Short Description (max 80 characters)**
```
Doorli — Order, book, and get services from local businesses near you.
```

**Full App Store Description**
```
Doorli is the community super-app that connects you to every local 
business in your area — all in one place.

ORDER GROCERIES & ESSENTIALS
Shop from local grocery stores, supermarkets, pharmacies, and bakeries. 
Real stock, fast delivery, right to your door.

ORDER FOOD
Your favourite restaurants and cafes, all in one menu. Track your 
delivery live on the map.

BOOK HOTELS & ROOMS
Find the best local stays, check real availability, and book 
instantly without any phone calls.

BOOK WEDDING HALLS & EVENT VENUES
Browse halls, compare packages, and secure your date with a deposit 
— all from your phone.

PLAN YOUR ENTIRE EVENT
Venue, catering, decoration, photography — book every vendor for 
your event in one place.

HIRE HOME PROFESSIONALS
Need a plumber, electrician, or cleaner urgently? Post your job and 
a verified professional comes to you fast.

BEAUTY & WELLNESS
Book salon appointments, spa treatments, and clinic visits with 
real-time availability.

WHY DOORLI?
✓ Everything local in one app
✓ Real-time delivery tracking
✓ Verified and reviewed businesses
✓ Secure online payments
✓ Available 24/7

Download Doorli and bring your local community to your fingertips.
```

---

## 🏢 About Doorli

Doorli was born from one simple observation: the best businesses in any community are the small, local ones — but they are the hardest to find and order from online.

We are building the infrastructure that lets every corner shop, every family restaurant, every skilled tradesperson, and every event venue compete in the digital world — not by replacing them, but by connecting them to the customers who are already looking for exactly what they offer.

Our mission is to make local life frictionless. To make the person who needs groceries at 8pm able to get them without leaving home. To make the young couple planning their wedding able to compare halls and book caterers on a Sunday morning. To make the homeowner with a burst pipe able to find a trusted plumber in minutes, not hours.

Doorli is not just an app. It is the digital heart of your local community.

---

*Built with ❤️ for local communities everywhere.*
