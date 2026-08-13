# `.kiro` Requirements Status

This report maps `.kiro/specs/doorli-full-platform-completion/` to the implementation currently in the repository.

## Implemented And Verified

- Core marketplace, vendor discovery, product browsing, checkout, orders, bookings, services, events, forums, SOS, GovTech, reviews, loyalty, subscriptions, and ERP webhook routes exist.
- Wallet balance, top-up, payment, transfer, KYC, transaction history, and idempotency are implemented through `WalletTransaction` and the wallet service.
- Bills and recharge flows exist with biller search and wallet-backed payment.
- Ride request, fare estimation, vehicle selection, idempotent creation, history, cancellation, status transitions, and wallet settlement exist.
- Transit route search, schedules, seats, Redis reservations, wallet booking, HMAC QR generation/validation, ticket listing, journey planning, and parking data exist.
- Customer web pages now exist for `/wallet`, `/bills`, `/ride`, `/mobility`, `/mobility/bus`, `/health`, and `/courier`.
- API, auth service, customer web, and Super Admin production builds pass locally.
- GitHub Actions CI provisions PostgreSQL and Redis, applies migrations, builds, lints, and runs API tests.

## Implemented But Not Production Complete

- Community posts currently use an in-memory array. They do not survive process restarts and do not satisfy the Prisma persistence/moderation requirements.
- Health, courier, and transit seed data are in route modules rather than persisted domain models and partner integrations.
- Wallet currently has an auditable transaction layer but not the full spec model set for double-entry journal accounts, auto-top-up rules, payout withdrawals, or payment gateway settlement.
- Bus reservations use a Redis list with a longer seat-map TTL; a production implementation needs atomic seat locking and durable `TransitTicket`/`IntercityBooking` records.
- Ride matching and driver settlement require integration with the dedicated ride-hailing service and real driver location flow.
- The customer pages use coordinate defaults for courier jobs and do not yet provide map/geocoding selection.

## Missing From The Current Repository

- Community database models, interest groups, persisted flags, and a customer Community page.
- AI assistant API/session/action models and confirmed multi-action execution flow.
- Premium subscription model, renewal job, delivery waiver, and priority dispatch.
- Auto-top-up/reminder jobs, payout withdrawal, and full wallet KYC document flow.
- Full health models, prescription upload/storage validation, medicine ordering, and appointment uniqueness.
- Full courier job state machine, runner dispatch, tracking, proof-of-delivery storage, and delayed redispatch.
- Customer mobile wallet, bills, transit, health, courier, and AI screens.
- Complete Super Admin live-data audit across every scaffolded page.

## Recommended Build Order

1. Replace Community in-memory state with Prisma models and a customer feed page.
2. Add durable transit ticket/intercity models and atomic Redis seat locks.
3. Complete wallet double-entry accounts, auto-top-up, payouts, and gateway webhooks.
4. Add Premium membership and delivery/dispatch benefits.
5. Add AI parse/confirm/execute with action audit logs.
6. Port the verified web flows to mobile and run authenticated end-to-end tests with PostgreSQL, Redis, Stripe test keys, and a test SMS provider.
