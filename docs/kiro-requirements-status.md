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
- Community persistence now uses Prisma models for posts, groups, memberships, and moderation flags.
- Premium membership is persisted and charged through the wallet ledger.
- AI sessions and action logs are persisted with rule-based parse and confirmation-gated execution.
- Transit tickets are persisted and seat reservations use atomic Redis locks.
- Mobile customer screens exist for Wallet, Bills, Mobility, Bus Tickets, and Community.
- Wallet supports persistent auto-top-up rules, filtered history, payout requests, and double-entry journal records.

## Implemented But Not Production Complete

- Health providers, appointments, lab orders, medicine orders, nursing bookings, class bookings, and courier jobs now have persisted Prisma domain models and migration coverage. Real provider/runner dispatch and partner integrations remain deployment work.
- Wallet payout requests remain pending until a real bank/UPI gateway worker settles them.
- Ride matching and driver settlement require integration with the dedicated ride-hailing service and real driver location flow.
- Courier UI still uses coordinate defaults for address submission; map/geocoding selection remains deployment/provider work.

## Remaining Required Work

- Premium renewal execution is implemented in the API scheduler; delivery waiver is implemented for Premium orders. Priority dispatch still needs the production dispatch provider.
- Auto-top-up execution/reminder jobs, payout withdrawal settlement, and full wallet KYC document flow.
- Prescription upload/storage validation and real medicine fulfillment.
- Full courier runner dispatch, live runner tracking, and delayed redispatch.
- Super Admin alternate/scaffolded pages still need a full live-data audit.
- External Stripe/UPI/bank, SMS, maps, storage, push, and provider integrations.

## Recommended Build Order

1. Add provider/runner dispatch, live tracking, and map/geocoding selection.
2. Connect Stripe/UPI/bank gateways, payout settlement workers, auto-top-up jobs, and SMS confirmations.
3. Integrate ride-hailing and delivery Socket.io rooms with real driver location/offer flows.
4. Add Premium renewal, free-delivery waiver, priority dispatch, and exclusive deals.
5. Port Health, Courier, and Assistant flows to mobile.
6. Run authenticated end-to-end tests with PostgreSQL, Redis, Stripe test keys, and a test SMS provider.
