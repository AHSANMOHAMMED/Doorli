# Doorli Phase 1.5 Build Plan

## Product Goal

Make Doorli useful every day by connecting the existing marketplace, rides, wallet, bills, and community capabilities behind one customer experience.

## Current Baseline

- Customer web already supports marketplace discovery, checkout, orders, rides, services, events, community, and authentication.
- API already exposes wallet, biller, bill payment, ride, transit, and service-request routes.
- Prisma/PostgreSQL is the shared data layer.
- The first delivery should reuse these foundations instead of creating parallel services.

## Delivery Order

### Milestone 1: Wallet + Bills (Sprints 0-3)

Outcome: an authenticated customer can view balance, top up, browse billers, recharge/pay a bill, and see a clear result.

- Customer Wallet screen
- Customer Bills screen
- Home quick actions for Wallet and Bills
- API contract checks and error states
- Follow-up: transaction history and double-entry ledger hardening

### Milestone 2: Mobility v1 (Sprints 4-7)

Outcome: a customer can estimate and request a ride, track request status, and use the existing driver dispatch path.

- Vehicle type and fare options
- Ride history and active ride status
- Driver location updates and customer tracking
- Cancellation, safety, and support actions
- Transit operator integration after ride flow is stable

### Milestone 3: Daily Habit Layer (Sprints 8-9)

- Pharmacy and prescription upload
- Laundry and errands
- Better service-request matching
- Personalised home feed
- Analytics events for activation and repeat use

### Milestone 4: Expansion (Sprints 10-12)

- Intercity bus inventory and seat selection
- Rule-based assistant with confirmed actions
- Community feed MVP
- Premium membership
- Security/performance review and neighbourhood expansion

## Phase 1.5 Definition of Done

- A logged-in customer can complete a grocery order, ride request, and bill payment in one app.
- Wallet balance and payment outcomes are visible after every money action.
- Insufficient balance, unauthenticated access, loading, and API failure states are handled.
- `npm run lint`, `npm run build`, and relevant API tests pass.
- Launch metrics are instrumented: wallet activation, bill payment success, ride completion, repeat usage, and contribution margin by neighbourhood.

## Immediate Build Slice

This iteration implements Milestone 1 customer surfaces. It intentionally does not claim production-grade financial ledger compliance; the existing wallet endpoints need a later double-entry/idempotency pass before real-money scale.
