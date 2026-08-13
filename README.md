# 🚪 Doorli — Everything Local. Delivered.

> **The community super-app** combining Talabat + Grab + Urban Company + local transit + Nextdoor — purpose-built for neighbourhoods. One login, one wallet, one loyalty programme. Groceries, food, rides, bus tickets, bill payments, home services, health bookings, beauty, hotels, halls, events, courier, community feed, GovTech, emergency SOS, and AI assistant — all in one app.

**Author:** AHSAN MOHAMMED · [ahsanmohammed828@gmail.com](mailto:ahsanmohammed828@gmail.com)  
**Repo:** `/Users/ahsan/Documents/myStartup/Doorli/`  
**Spec files:** `.kiro/specs/doorli-full-platform-completion/` (requirements.md · design.md · tasks.md)  
**OCI host:** `140.245.207.93` · **Domain:** `doorli.me` · **Enterprise OS:** `enterprise.doorli.me`

---

## ⚡ AGENT HANDOFF — READ THIS FIRST

This README is the **single source of truth** for any AI agent or IDE continuing this build.

### What is already built and working

| Layer | Status | Notes |
|-------|--------|-------|
| API Gateway (`services/api`) | ✅ Complete | Express, port 4000, 23+ modules all wired |
| Auth service (`services/auth`) | ✅ Complete | OTP + Google OAuth, JWT, refresh, RBAC |
| Delivery service (`services/delivery`) | ✅ Complete | Orders, drivers, payments, Socket.io dispatch |
| Ride-hailing (`services/ride-hailing`) | ✅ Complete | Fare engine, Socket.io matching, port 8085 |
| Notifications (`services/notifications`) | ✅ Complete | FCM push, SMS, in-app, BullMQ |
| Search (`services/search`) | ✅ Complete | Elasticsearch 8, vendor index, events consumer |
| Forum service (`services/forum-service`) | ✅ Complete | Threads, replies, moderation |
| Emergency service (`services/emergency-service`) | ✅ Complete | SOS, incidents, dispatch |
| Gov service (`services/gov-service`) | ✅ Complete | Tax, permits, complaints, document vault |
| Chat (`services/chat`) | ✅ Complete | Socket.io rooms |
| Storage (`services/storage`) | ✅ Complete | MinIO/S3 upload, multer |
| AI service (`services/ai-service`) | ✅ Complete | OpenAI/Anthropic/Gemini, port 4006 |
| Customer web (`apps/customer-web`) | ✅ Complete | All pages wired: home, search, shop, checkout, orders, tracking, beauty, events, forums, gov, hotel, hall, SOS, notifications, subscriptions, AI picks |
| Vendor web (`apps/vendor-web`) | ✅ Complete | Dashboard, orders kanban, analytics, bookings, products, POS, ERP provisioning |
| Super Admin (`apps/super-admin`) | ✅ Wired | 30+ pages using `superAdminFetch`, real API |
| Mobile app (`apps/mobile`) | ✅ Scaffolded | Full screen hierarchy for all roles via Expo Router; most screens wired |
| ERP app (`apps/erp`) | ✅ Complete | Next.js + Drizzle, 120+ migrations, POS/accounting/HR |
| Prisma schema | ✅ Complete | 8 migrations, PostGIS, all core models |
| OCI production | ✅ Live | API health ✓, Frappe 683 tables ✓, Marketplace API ✓ |

### Service ports (local dev)

| Service | Port |
|---------|------|
| API Gateway | 4000 |
| Auth | 4001 |
| Delivery | 4002 (internal 8086) |
| Search | 4004 |
| Storage | 4005 |
| AI | 4006 |
| Notifications | 4007 |
| Ride-hailing | 8085 |
| Forum | 8087 |
| Emergency | 8088 |
| Gov | 8089 |
| Customer web | 3000 |
| Vendor web | 3002 |
| Super Admin | 3005 |
| ERP | 3001 |
| PostgreSQL | 5432 (local) / 5433 (OCI) |
| Redis | 6379 |

---

## 🏗️ Monorepo Structure

```
Doorli/
├── apps/
│   ├── customer-web/          # Next.js 14, port 3000 — customer-facing
│   ├── vendor-web/            # Next.js 14, port 3002 — vendor dashboard
│   ├── super-admin/           # Next.js 14, port 3005 — platform admin
│   ├── admin/                 # Next.js 14 — lightweight admin
│   ├── erp/                   # Next.js 14 + Drizzle — embedded POS/ERP, port 3001
│   ├── hotel/                 # Next.js 14 — hotel-specific UI
│   └── mobile/                # React Native + Expo — all roles
├── services/
│   ├── api/                   # Core Express gateway, port 4000
│   ├── auth/                  # OTP + Google OAuth, port 4001
│   ├── delivery/              # Dispatch + orders + payments, port 4002
│   ├── ride-hailing/          # Rides + Socket.io, port 8085
│   ├── notifications/         # FCM + SMS + in-app, port 4007
│   ├── search/                # Elasticsearch, port 4004
│   ├── storage/               # MinIO/S3, port 4005
│   ├── ai-service/            # OpenAI/Anthropic, port 4006
│   ├── chat/                  # Real-time chat
│   ├── forum-service/         # Forums, port 8087
│   ├── emergency-service/     # SOS + incidents, port 8088
│   └── gov-service/           # GovTech, port 8089
├── packages/
│   ├── db/                    # Prisma schema + client (@doorli/db)
│   ├── design-tokens/         # Shared design system
│   ├── types/                 # Shared TypeScript types
│   └── utils/                 # Shared middleware (RBAC, validators)
├── scripts/
│   ├── smoke-oci.sh           # Basic production health check
│   ├── e2e-smoke-authenticated.sh  # Full E2E journey tests
│   ├── verify-erp-callback.sh      # ERP webhook tests
│   ├── verify-stripe-webhook.sh    # Stripe webhook tests
│   ├── verify-dns-tls.sh           # DNS + TLS verification
│   ├── warm-redis-cache.sh         # Redis cache warming
│   └── setup-elasticsearch.sh     # ES index setup
├── deploy/
│   ├── oci/
│   │   ├── open-ingress.sh    # OCI security list — open ports 80+443
│   │   ├── logrotate.conf     # Log rotation config
│   │   └── setup-logrotate.sh # Install logrotate on OCI
│   ├── grafana-dashboard.json # Grafana dashboard for API metrics
│   └── alertmanager.yml       # Alertmanager config
├── docs/
│   ├── production-checklist.md    # Full go-live checklist
│   ├── enterprise-os-integration.md
│   └── OCI_DUAL_REPO_OPS.md
├── prometheus.yml             # Prometheus scrape config (all services)
├── alerts.yml                 # Prometheus alert rules
├── docker-compose.yml         # Full stack
├── docker-compose.minimal.yml # Minimal (db + redis only)
└── .env.example               # All environment variables documented
```

---

## 🚀 Local Development Quick Start

```bash
# 1. Clone and install
cd ~/Documents/myStartup
git clone https://github.com/AHSANMOHAMMED/Doorli
cd Doorli
npm install

# 2. Environment setup
cp .env.example .env
# Edit .env — minimum required for local dev:
# DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_REFRESH_SECRET, ERP_INTERNAL_SECRET

# 3. Start infrastructure
docker compose -f docker-compose.yml up -d db redis

# 4. Apply migrations and seed
npm run db:migrate:deploy
npm run db:seed

# 5. Start services (separate terminals)
npm run dev --workspace=@doorli/api        # port 4000
npm run dev --workspace=@doorli/auth       # port 4001

# 6. Start web apps
cd apps/customer-web && npm run dev -- --hostname 0.0.0.0 -p 3000
cd apps/vendor-web && npm run dev -- -p 3002

# 7. Verify
curl http://127.0.0.1:4000/health
# → {"status":"ok","db":true,"redis":true}
```

**Demo accounts (after seed):**
| Role | Email | Password |
|------|-------|----------|
| Customer | `customer@doorli.test` | `Doorli123!` |
| Vendor | `vendor@doorli.test` | `Doorli123!` |
| Driver | `driver@doorli.test` | `Doorli123!` |
| Admin | `admin@doorli.test` | `Doorli123!` |

---

## 📋 REMAINING TASKS — COMPLETE THESE (for any AI agent continuing)

All tasks below are **not yet implemented**. Work through them in wave order. Each task includes the exact files to create/edit.

---

### WAVE 1 — Super Admin & Mobile Wiring (can run in parallel)

#### Task 1 — Fix Super Admin Panel

**Files to edit:**

**1. Fix API URL** — `apps/super-admin/src/lib/api.ts`  
Change default from `http://localhost:3000/api/v1` → `http://localhost:4000/api/v1` *(already fixed, verify)*

**2. Wire system-broadcasts** — `apps/super-admin/src/app/system-broadcasts/page.tsx`  
The "Dispatch Now" button is disconnected. Wire it:
```typescript
// Add state for form inputs
const [broadcastTitle, setBroadcastTitle] = useState('');
const [broadcastBody, setBroadcastBody] = useState('');
const [sending, setSending] = useState(false);

// Wire the button:
async function handleDispatch() {
  setSending(true);
  await superAdminFetch('/admin/broadcasts', {
    method: 'POST',
    body: JSON.stringify({ title: broadcastTitle, body: broadcastBody, type: 'admin_broadcast' })
  });
  setSending(false);
  alert('Broadcast sent to all active users');
}
```
Connect the title/body inputs and the "Dispatch Now" button to this handler.

**3. Fix ERP sync logs** — `apps/super-admin/src/app/erp-synchronization-logs/page.tsx`  
Currently calls `/admin/diagnostics` (wrong). Change to `/admin/erp/sync-logs`.  
Map response fields: `id`, `createdAt` as timestamp, `vendor.businessName` as entityType, `erpSyncStatus` as status, `erpSyncError` as error, `totalAmount` as objectCount.

**4. Fix active-users-monitoring** — `apps/super-admin/src/app/active-users-monitoring/page.tsx`  
Read file. If it has mock data, replace with:
```typescript
useEffect(() => {
  superAdminFetch('/admin/stats').then(res => {
    if (res.success) setStats(res.data); // { totalVendors, activeDrivers, ordersToday, revenue30d }
  });
}, []);
```

**5. Add activate/deactivate to user-management** — `apps/super-admin/src/app/user-management/page.tsx`  
Each user card needs a toggle button:
```typescript
async function toggleActive(userId: string, current: boolean) {
  const res = await superAdminFetch(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive: !current })
  });
  if (res.success) setUsers(prev => prev.map(u => u.id === userId ? {...u, isActive: !current} : u));
}
```

---

#### Task 2 — Mobile App Wiring Verification

**Files to check/fix in `apps/mobile/app/`:**

**2.1** `(customer)/index.tsx` — must call `GET /vendors/nearby?lat=&lng=&radius=5` using `expo-location`. If it's just a `<Redirect>`, implement it fully with a vendor card list.

**2.3** `(customer)/track/[orderId].tsx` — add Socket.io subscription:
```typescript
import { useSocket } from '../../lib/socket';
const socket = useSocket();
useEffect(() => {
  socket.emit('join_order', { orderId });
  socket.on('order:status_update', (data) => setStatus(data.newStatus));
  socket.on('driver:location_update', (data) => setDriverCoords({ lat: data.lat, lng: data.lng }));
  return () => { socket.off('order:status_update'); socket.off('driver:location_update'); };
}, [orderId]);
```

**2.4** `(driver)/jobs.tsx` — add 30-second countdown for offered jobs:
```typescript
// In the job offer card, add countdown timer
const [countdown, setCountdown] = useState(30);
useEffect(() => {
  const timer = setInterval(() => {
    setCountdown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
  }, 1000);
  return () => clearInterval(timer);
}, [jobId]);
```

**2.5** `(driver)/navigate/[orderId].tsx` — add Google Maps deep-link button:
```typescript
const openNavigation = (lat: number, lng: number, address: string) => {
  const url = Platform.OS === 'ios'
    ? `maps://?daddr=${lat},${lng}`
    : `google.navigation:q=${lat},${lng}`;
  Linking.openURL(url);
};
```

**2.6** `(vendor)/orders.tsx` — add audio alert for new orders. Add to Socket.io `new_order` handler:
```typescript
import { Audio } from 'expo-av';
async function playAlert() {
  const { sound } = await Audio.Sound.createAsync(require('../../assets/new-order.mp3'));
  await sound.playAsync();
}
socket.on('order:new_order', () => { queryClient.invalidateQueries(['vendor-orders']); playAlert(); });
```

**2.7** `(vendor)/menu.tsx` — read file. If it's a stub, implement:
```typescript
// Full product management screen with:
// - FlatList of products from GET /api/v1/products?vendorId=<vendor>
// - Each row: name, price, stock count, toggle available button
// - "Add product" FAB → modal form: name, price, stock, category, image
// - Inline stock edit: tap stock number → TextInput → PATCH /api/v1/products/:id
// - Delete: swipe-to-delete → DELETE /api/v1/products/:id
```

---

### WAVE 2 — Production Gate

#### Task 3 — OCI Hotfixes & Deployment

```bash
# 3.1: Fix Prisma target (already correct in local repo, commit to git)
git add packages/db/.env
git commit -m "fix: use localhost:5432 for local, OCI uses localhost:5433"

# 3.2: Vendor stats endpoint (already in code, verify it's committed)
git add services/api/src/modules/vendors/vendors.routes.ts
git commit -m "fix: add vendor stats endpoint GET /api/v1/vendors/stats"

# 3.3: Redeploy on OCI
ssh ubuntu@140.245.207.93
cd /opt/doorli && git pull && npm install
npm run db:migrate:deploy
pm2 restart all  # or docker compose restart

# 3.4: Configure log rotation
sudo cp /opt/doorli/deploy/oci/logrotate.conf /etc/logrotate.d/doorli
sudo logrotate -d /etc/logrotate.d/doorli  # test
```

#### Task 4 — E2E Smoke Tests

```bash
# Run the full authenticated journey (scripts already created):
DOORLI_API_BASE=http://140.245.207.93 ./scripts/e2e-smoke-authenticated.sh
# Tests: login → browse → order → vendor confirm → driver deliver → earnings → ride estimate
```

#### Task 5 — DNS, TLS, Ingress

```bash
# Open OCI ports 80 and 443:
./deploy/oci/open-ingress.sh

# Verify DNS and TLS:
./scripts/verify-dns-tls.sh

# Test ERP callbacks:
./scripts/verify-erp-callback.sh

# Register Stripe webhook at: https://dashboard.stripe.com/webhooks
# URL: https://doorli.me/api/v1/payments/webhook/stripe
# Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
./scripts/verify-stripe-webhook.sh
```

#### Task 6 — Monitoring, Backups, Alerting

```bash
# 6.1: Start Prometheus + Grafana (add to docker-compose.prod.yml):
# prometheus: image: prom/prometheus, volumes: [./prometheus.yml:/etc/prometheus/prometheus.yml]
# grafana:    image: grafana/grafana, ports: ['3030:3000']
# Import deploy/grafana-dashboard.json into Grafana

# 6.2: PostgreSQL backup cron (add to crontab on OCI):
# 0 2 * * * /opt/doorli/scripts/backup-postgres.sh

# 6.3: Set up UptimeRobot (free): monitor https://doorli.me/health every 1 min
# Or configure alertmanager.yml with email/PagerDuty

# 6.4: Add SENTRY_DSN to OCI .env, then restart all services
# SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

### WAVE 3 — Feature Completeness Audit (Task 7)

Verify each vertical works end-to-end. Run against local or OCI:

```bash
# 7.1 Grocery
curl "http://localhost:4000/api/v1/vendors/nearby?lat=6.93&lng=79.84&radius=5&category=grocery"

# 7.2 Restaurant — checkout flow
# Login → get vendor → add to cart → POST /orders → PATCH /orders/:id/status → verify

# 7.3 Hotels — booking flow
# GET /vendors?category=hotel → GET /vendors/:id/availability?from=&to= → POST /bookings

# 7.4–7.13: Repeat pattern for hall, beauty, service-requests, events, ride, forums, SOS, gov, corporate, ai-picks
```

**Known gaps to fix during audit:**
- If `GET /vendors/nearby?category=grocery` returns empty → add seed data via `npm run db:seed`
- If bookings don't create ERP records → check `ERP_INTERNAL_SECRET` and `ERP_EMBEDDED_URL`
- If ride matching fails → ensure a driver account is online (`PATCH /drivers/go-online`)

---

### WAVE 4 — Doorli Wallet Service (Task 9) 🔴 PREREQUISITE FOR WAVES 5+

**This is the most critical remaining feature.** Bills, Mobility tickets, Health bookings, Premium membership, and the home screen wallet widget all depend on it.

#### Step 1: Add Prisma models

Edit `packages/db/prisma/schema.prisma` — add at the bottom:

```prisma
model WalletAccount {
  id           String        @id @default(uuid()) @db.Uuid
  userId       String        @unique @map("user_id") @db.Uuid
  balance      Decimal       @default(0) @db.Decimal(18, 2)
  currency     String        @default("LKR") @db.VarChar(3)
  kycLevel     Int           @default(0) @map("kyc_level")
  dailyLimit   Decimal       @default(10000) @map("daily_limit") @db.Decimal(18, 2)
  isActive     Boolean       @default(true) @map("is_active")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  user         User          @relation(fields: [userId], references: [id])
  entries      LedgerEntry[]
  @@map("wallet_accounts")
}

model LedgerEntry {
  id             String        @id @default(uuid()) @db.Uuid
  walletId       String        @map("wallet_id") @db.Uuid
  type           String        @db.VarChar(30)  // topup|payment|transfer_in|transfer_out|payout|refund
  amount         Decimal       @db.Decimal(18, 2)
  balanceBefore  Decimal       @map("balance_before") @db.Decimal(18, 2)
  balanceAfter   Decimal       @map("balance_after") @db.Decimal(18, 2)
  referenceId    String?       @map("reference_id") @db.Uuid
  referenceType  String?       @map("reference_type") @db.VarChar(50)
  description    String?
  idempotencyKey String?       @unique @map("idempotency_key") @db.VarChar(100)
  createdAt      DateTime      @default(now()) @map("created_at")
  wallet         WalletAccount @relation(fields: [walletId], references: [id])
  @@map("ledger_entries")
}

model WalletTransfer {
  id             String   @id @default(uuid()) @db.Uuid
  fromUserId     String   @map("from_user_id") @db.Uuid
  toUserId       String   @map("to_user_id") @db.Uuid
  amount         Decimal  @db.Decimal(18, 2)
  note           String?
  idempotencyKey String?  @unique @map("idempotency_key") @db.VarChar(100)
  createdAt      DateTime @default(now()) @map("created_at")
  @@map("wallet_transfers")
}
```

Then run:
```bash
cd /Users/ahsan/Documents/myStartup/Doorli
npx prisma migrate dev --name add_wallet_models
```

#### Step 2: Create wallet routes

Create `services/api/src/modules/wallet/wallet.routes.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const walletRouter = Router();
walletRouter.use(authenticateToken);

// GET /wallet/balance — get or create wallet
walletRouter.get('/balance', async (req, res, next) => {
  try {
    const wallet = await prisma.walletAccount.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id },
      update: {},
    });
    res.json({ success: true, data: { balance: Number(wallet.balance), currency: wallet.currency, kycLevel: wallet.kycLevel } });
  } catch (err) { next(err); }
});

// POST /wallet/topup — add funds
walletRouter.post('/topup', async (req, res, next) => {
  try {
    const { amount, method, idempotencyKey } = z.object({
      amount: z.number().positive().max(100000),
      method: z.enum(['stripe', 'upi', 'bank']).default('stripe'),
      idempotencyKey: z.string().optional(),
    }).parse(req.body);

    const existing = idempotencyKey
      ? await prisma.ledgerEntry.findUnique({ where: { idempotencyKey } })
      : null;
    if (existing) return res.json({ success: true, data: existing, cached: true });

    const wallet = await prisma.walletAccount.upsert({
      where: { userId: req.user!.id }, create: { userId: req.user!.id }, update: {},
    });

    const [entry, updated] = await prisma.$transaction([
      prisma.ledgerEntry.create({
        data: {
          walletId: wallet.id, type: 'topup', amount,
          balanceBefore: wallet.balance, balanceAfter: Number(wallet.balance) + amount,
          description: `Top-up via ${method}`, idempotencyKey,
        },
      }),
      prisma.walletAccount.update({
        where: { id: wallet.id }, data: { balance: { increment: amount } },
      }),
    ]);
    res.json({ success: true, data: { balance: Number(updated.balance), entry } });
  } catch (err) { next(err); }
});

// POST /wallet/pay — deduct for order/ride/booking
walletRouter.post('/pay', async (req, res, next) => {
  try {
    const { amount, referenceId, referenceType, idempotencyKey } = z.object({
      amount: z.number().positive(),
      referenceId: z.string().uuid(),
      referenceType: z.string(),
      idempotencyKey: z.string().optional(),
    }).parse(req.body);

    const existing = idempotencyKey
      ? await prisma.ledgerEntry.findUnique({ where: { idempotencyKey } })
      : null;
    if (existing) return res.json({ success: true, data: existing, cached: true });

    const wallet = await prisma.walletAccount.findUnique({ where: { userId: req.user!.id } });
    if (!wallet || Number(wallet.balance) < amount)
      throw new AppError(400, 'Insufficient wallet balance');

    const [entry, updated] = await prisma.$transaction([
      prisma.ledgerEntry.create({
        data: {
          walletId: wallet.id, type: 'payment', amount,
          balanceBefore: wallet.balance, balanceAfter: Number(wallet.balance) - amount,
          referenceId, referenceType, idempotencyKey,
        },
      }),
      prisma.walletAccount.update({
        where: { id: wallet.id }, data: { balance: { decrement: amount } },
      }),
    ]);
    res.json({ success: true, data: { balance: Number(updated.balance), entry } });
  } catch (err) { next(err); }
});

// POST /wallet/transfer — P2P transfer
walletRouter.post('/transfer', async (req, res, next) => {
  try {
    const { toPhone, amount, note, idempotencyKey } = z.object({
      toPhone: z.string(),
      amount: z.number().positive(),
      note: z.string().optional(),
      idempotencyKey: z.string().optional(),
    }).parse(req.body);

    const existing = idempotencyKey
      ? await prisma.walletTransfer.findUnique({ where: { idempotencyKey } })
      : null;
    if (existing) return res.json({ success: true, data: existing, cached: true });

    const toUser = await prisma.user.findFirst({ where: { phone: toPhone } });
    if (!toUser) throw new AppError(404, 'Recipient not found');

    const [fromWallet, toWallet] = await Promise.all([
      prisma.walletAccount.upsert({ where: { userId: req.user!.id }, create: { userId: req.user!.id }, update: {} }),
      prisma.walletAccount.upsert({ where: { userId: toUser.id }, create: { userId: toUser.id }, update: {} }),
    ]);

    if (Number(fromWallet.balance) < amount) throw new AppError(400, 'Insufficient balance');

    const transferId = crypto.randomUUID();
    await prisma.$transaction([
      prisma.walletAccount.update({ where: { id: fromWallet.id }, data: { balance: { decrement: amount } } }),
      prisma.walletAccount.update({ where: { id: toWallet.id }, data: { balance: { increment: amount } } }),
      prisma.walletTransfer.create({ data: { fromUserId: req.user!.id, toUserId: toUser.id, amount, note, idempotencyKey } }),
    ]);
    res.json({ success: true, data: { transferId, amount, toPhone } });
  } catch (err) { next(err); }
});

// GET /wallet/transactions — history
walletRouter.get('/transactions', async (req, res, next) => {
  try {
    const wallet = await prisma.walletAccount.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) return res.json({ success: true, data: [] });
    const { type, limit = '20', cursor } = req.query as Record<string, string>;
    const entries = await prisma.ledgerEntry.findMany({
      where: { walletId: wallet.id, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit), 50),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    res.json({ success: true, data: entries });
  } catch (err) { next(err); }
});

// POST /wallet/kyc/basic — level 1
walletRouter.post('/kyc/basic', async (req, res, next) => {
  try {
    const updated = await prisma.walletAccount.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, kycLevel: 1, dailyLimit: 10000 },
      update: { kycLevel: 1, dailyLimit: 10000 },
    });
    res.json({ success: true, data: { kycLevel: updated.kycLevel, dailyLimit: Number(updated.dailyLimit) } });
  } catch (err) { next(err); }
});

// POST /wallet/kyc/full — level 2
walletRouter.post('/kyc/full', async (req, res, next) => {
  try {
    const updated = await prisma.walletAccount.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, kycLevel: 2, dailyLimit: 100000 },
      update: { kycLevel: 2, dailyLimit: 100000 },
    });
    res.json({ success: true, data: { kycLevel: updated.kycLevel, dailyLimit: Number(updated.dailyLimit) } });
  } catch (err) { next(err); }
});

export default walletRouter;
```

#### Step 3: Register wallet routes

Edit `services/api/src/routes/index.ts` — add:
```typescript
import walletRouter from '../modules/wallet/wallet.routes.js';
// ...
router.use('/api/v1/wallet', walletRouter);
```

#### Step 4: Create Wallet web page

Create `apps/customer-web/src/app/wallet/page.tsx` — a page with:
- Balance display card (fetch from `GET /wallet/balance`)
- Top-up button (opens modal with amount input, calls `POST /wallet/topup`)
- Transaction history list (fetch from `GET /wallet/transactions`)
- P2P transfer form (phone number + amount, calls `POST /wallet/transfer`)
- KYC upgrade section (basic/full buttons)

#### Step 5: Create Wallet mobile screen

Create `apps/mobile/app/(customer)/wallet.tsx` with same logic using React Native components.

---

### WAVE 5 — New Feature Modules (all depend on Wallet, can run in parallel)

#### Task 10 — Bills & Recharges

**New Prisma models** (add to schema.prisma):
```prisma
model Biller {
  id       String @id @default(uuid()) @db.Uuid
  name     String @db.VarChar(100)
  type     String @db.VarChar(30) // mobile|dth|electricity|water|gas|internet|school|society|fastag
  logoUrl  String? @map("logo_url")
  apiCode  String? @map("api_code")  // operator reference
  isActive Boolean @default(true) @map("is_active")
  @@map("billers")
}
model BillPayment {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  billerId    String   @map("biller_id") @db.Uuid
  amount      Decimal  @db.Decimal(18, 2)
  accountRef  String   @map("account_ref") @db.VarChar(100) // phone/account number
  status      String   @default("pending") @db.VarChar(20)
  txnRef      String?  @map("txn_ref")
  createdAt   DateTime @default(now()) @map("created_at")
  @@map("bill_payments")
}
```

**New routes** — create `services/api/src/modules/bills/bills.routes.ts`:
- `GET /billers/search?q=` — full-text search on name+type, return results within 300ms
- `POST /bills/recharge` — body: `{ billerId, accountRef, amount }` → debit wallet, create BillPayment, return txnRef
- `POST /bills/pay` — same pattern for utility bills
- `GET /bills/history` — paginated BillPayment list for user

**Seed billers** — add to `packages/db/prisma/seed.ts`:
```typescript
const billers = [
  { name: 'Dialog Mobile', type: 'mobile' },
  { name: 'Mobitel', type: 'mobile' },
  { name: 'CEB Electricity', type: 'electricity' },
  { name: 'LECO', type: 'electricity' },
  { name: 'National Water Supply', type: 'water' },
  { name: 'Laugfs Gas', type: 'gas' },
  { name: 'SLT Broadband', type: 'internet' },
  { name: 'PEO TV (DTH)', type: 'dth' },
];
```

**UI** — create `apps/customer-web/src/app/bills/page.tsx` and `apps/mobile/app/(customer)/bills.tsx`:
- Category grid (mobile, electricity, water, gas, DTH, internet, school, society)
- Search biller by name
- Enter account/phone number
- Show amount (fetch from biller API or manual entry)
- Confirm & pay from wallet

---

#### Task 11 — Extended Mobility (Transit, Intercity Bus, Parking)

**New Prisma models** (add to schema.prisma):
```prisma
model TransitRoute {
  id           String   @id @default(uuid()) @db.Uuid
  origin       String   @db.VarChar(100)
  destination  String   @db.VarChar(100)
  operatorName String   @map("operator_name") @db.VarChar(100)
  type         String   @db.VarChar(20)  // bus|metro|train
  fareMin      Decimal  @map("fare_min") @db.Decimal(10,2)
  fareMax      Decimal  @map("fare_max") @db.Decimal(10,2)
  isActive     Boolean  @default(true) @map("is_active")
  @@map("transit_routes")
}
model TransitTicket {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  routeId     String   @map("route_id") @db.Uuid
  seatNumber  String?  @map("seat_number")
  fareAmount  Decimal  @map("fare_amount") @db.Decimal(10,2)
  qrPayload   String   @map("qr_payload")  // HMAC-signed JSON
  departure   DateTime
  status      String   @default("active") @db.VarChar(20)
  createdAt   DateTime @default(now()) @map("created_at")
  @@map("transit_tickets")
}
```

**Routes** — create `services/api/src/modules/transit/transit.routes.ts`:
- `GET /transit/bus/routes?q=&date=` — list routes with seat availability
- `GET /transit/bus/:routeId/seats?date=` — seat map (states: available/occupied/reserved)
- `POST /transit/bus/seats/reserve` — Redis TTL lock for 10 min, return `reservationToken`
- `POST /transit/bus/bookings` — validate token, debit wallet, generate HMAC QR, send SMS
- `GET /transit/bus/tickets` — user's tickets
- `POST /transit/bus/tickets/validate` — verify HMAC hash
- `GET /transit/journey-plan?from=&to=` — multi-modal route
- `GET /transit/parking?lat=&lng=` — nearby parking

**QR Generation** (in transit.routes.ts):
```typescript
import { createHmac } from 'crypto';
function generateTicketQR(data: { routeId: string; seat: string; date: string; userId: string }) {
  const payload = JSON.stringify({ ...data, iat: Date.now() });
  const sig = createHmac('sha256', process.env.QR_HMAC_SECRET || 'doorli-qr-secret').update(payload).digest('hex');
  return JSON.stringify({ payload, sig });
}
```

**UI** — create mobility hub at `apps/customer-web/src/app/mobility/page.tsx`:
- Tabs: Rides | Bus Tickets | Intercity | Parking | Journey Planner
- Bus booking: route search → date → seat map SVG grid → payment → QR display
- QR screen: reads from localStorage first, renders even offline
- Seat map: color-coded (green=available, grey=occupied, blue=selected)

---

#### Task 12 — Health & Wellness

**New Prisma models** (add to schema.prisma):
```prisma
model HealthProvider {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(100)
  type        String   @db.VarChar(30) // doctor|lab|nurse|gym|yoga|pharmacy
  specialty   String?  @db.VarChar(100)
  lat         Float?
  lng         Float?
  city        String?  @db.VarChar(80)
  isActive    Boolean  @default(true) @map("is_active")
  @@map("health_providers")
}
model Appointment {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  providerId  String   @map("provider_id") @db.Uuid
  slotTime    DateTime @map("slot_time")
  type        String   @db.VarChar(30)
  status      String   @default("confirmed") @db.VarChar(20)
  notes       String?
  createdAt   DateTime @default(now()) @map("created_at")
  @@unique([providerId, slotTime])
  @@map("appointments")
}
```

**Routes** — create `services/api/src/modules/health/health.routes.ts`:
- `GET /health/providers/search?specialty=&lat=&lng=&type=`
- `POST /health/appointments` — block slot (unique constraint), notify provider
- `POST /health/lab-orders` — schedule collection
- `POST /health/medicine-orders` — require prescription for Rx items (error: `PRESCRIPTION_REQUIRED`)
- `POST /health/nursing-bookings`
- `POST /health/class-bookings` — check maxParticipants

**UI** — create `apps/customer-web/src/app/health/page.tsx`:
- Category grid: Doctor | Lab | Pharmacy | Nurse | Gym | Yoga
- Provider search with specialty filter and map view
- Appointment calendar (use a simple date/time slot picker)
- Prescription upload form (accepts image, validates before submitting)
- Medicine cart with Rx badge on prescription items

---

#### Task 13 — Courier & Errands

**New Prisma models**:
```prisma
model CourierJob {
  id             String   @id @default(uuid()) @db.Uuid
  customerId     String   @map("customer_id") @db.Uuid
  runnerId       String?  @map("runner_id") @db.Uuid
  type           String   @db.VarChar(30) // package|document|queue_pick|shifting
  status         String   @default("pending") @db.VarChar(20)
  pickupAddress  String   @map("pickup_address")
  dropoffAddress String   @map("dropoff_address")
  fareEstimate   Decimal? @map("fare_estimate") @db.Decimal(10,2)
  proofUrl       String?  @map("proof_url")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  @@map("courier_jobs")
}
```

**Routes** — create `services/api/src/modules/courier/courier.routes.ts`:
- `POST /courier/jobs` — create job, dispatch to nearest runner (reuse delivery dispatch pattern)
- `GET /courier/jobs/:id` — job detail with live location
- `PATCH /courier/jobs/:id/deliver` — proof of delivery (photo URL)
- `POST /errands/queue-pick` — queue picking errand
- `POST /errands/shifting` — house shifting with inventory list

**Dispatch reuse** — call `DispatchService.dispatchOrder()` from delivery service via HTTP or import.

**UI** — `apps/customer-web/src/app/courier/page.tsx`:
- Service type selector (Package, Document, Queue Pick, House Shifting)
- Address form (pickup + dropoff)
- Fare estimate display
- Live tracking view after dispatch
- Proof-of-delivery camera capture (mobile only)

---

#### Task 14 — Community Layer

**New Prisma models**:
```prisma
model CommunityPost {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  type        String   @db.VarChar(30) // general|recommendation|lost_found|giveaway|safety_alert
  content     String
  locality    String   @db.VarChar(100)
  mediaUrls   Json     @default("[]") @map("media_urls")
  isDeleted   Boolean  @default(false) @map("is_deleted")
  createdAt   DateTime @default(now()) @map("created_at")
  @@map("community_posts")
}
model ModerationFlag {
  id       String   @id @default(uuid()) @db.Uuid
  postId   String   @map("post_id") @db.Uuid
  userId   String   @map("user_id") @db.Uuid
  reason   String?
  createdAt DateTime @default(now()) @map("created_at")
  @@map("moderation_flags")
}
```

**Routes** — create `services/api/src/modules/community/community.routes.ts`:
- `GET /community/feed?locality=` — posts filtered by locality
- `POST /community/posts` — create post, safety_alert triggers broadcast notification
- `DELETE /community/posts/:id` — soft delete
- `POST /community/posts/:id/report` — create ModerationFlag
- `GET /community/events?locality=&from=&to=`

**UI** — `apps/customer-web/src/app/community/page.tsx`:
- Neighbourhood feed with locality selector
- Post composer with type dropdown
- Safety alert posts highlighted in red
- Lost & found items with "I have this" button
- Local events list

---

#### Task 15 — AI Assistant

**The `services/ai-service` is already built (port 4006).** Wire it to the frontend:

**New API endpoint** — add to `services/api/src/modules/ai-assistant/ai-assistant.routes.ts`:
```typescript
// POST /ai/parse — forward to ai-service
router.post('/parse', authenticateToken, async (req, res, next) => {
  try {
    const { message, lat, lng } = req.body;
    const resp = await fetch(`${process.env.AI_SERVICE_URL}/ai/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userId: req.user!.id, lat, lng }),
    });
    const data = await resp.json();
    res.json(data);
  } catch (err) { next(err); }
});

// POST /ai/execute — execute confirmed action plan
router.post('/execute', authenticateToken, async (req, res, next) => {
  try {
    const { actions } = req.body;
    // Execute each action by calling the relevant module API
    const results = await Promise.allSettled(
      actions.map(async (action: { module: string; params: Record<string, unknown> }) => {
        const base = `http://localhost:4000/api/v1`;
        // Route to correct endpoint based on action.module
        switch (action.module) {
          case 'food': return fetch(`${base}/orders`, { method: 'POST', headers: { 'Authorization': req.headers.authorization!, 'Content-Type': 'application/json' }, body: JSON.stringify(action.params) });
          case 'ride': return fetch(`${base}/rides`, { method: 'POST', headers: { 'Authorization': req.headers.authorization!, 'Content-Type': 'application/json' }, body: JSON.stringify(action.params) });
          case 'bills': return fetch(`${base}/bills/pay`, { method: 'POST', headers: { 'Authorization': req.headers.authorization!, 'Content-Type': 'application/json' }, body: JSON.stringify(action.params) });
          default: throw new Error(`Unknown module: ${action.module}`);
        }
      })
    );
    res.json({ success: true, data: results.map(r => r.status === 'fulfilled' ? { ok: true } : { ok: false, error: r.reason?.message }) });
  } catch (err) { next(err); }
});
```

**UI** — add to `apps/customer-web/src/app/page.tsx` home screen:
```tsx
// Persistent AI prompt bar
const [aiMessage, setAiMessage] = useState('');
const [aiPlan, setAiPlan] = useState(null);

async function handleAiSubmit() {
  const res = await apiFetch('/ai/parse', { method: 'POST', body: JSON.stringify({ message: aiMessage }) });
  setAiPlan(res.data);
}

// Render: input + send button + action plan confirmation modal
```

---

#### Task 16 — Premium Membership

**New Prisma model**:
```prisma
model PremiumSubscription {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @unique @map("user_id") @db.Uuid
  tier          String    @db.VarChar(20) // monthly|annual
  status        String    @default("active") @db.VarChar(20) // active|cancelled|expired
  startedAt     DateTime  @default(now()) @map("started_at")
  nextRenewalAt DateTime  @map("next_renewal_at")
  cancelledAt   DateTime? @map("cancelled_at")
  totalSavings  Decimal   @default(0) @map("total_savings") @db.Decimal(18,2)
  @@map("premium_subscriptions")
}
```

**Routes** — `services/api/src/modules/membership/membership.routes.ts`:
- `POST /membership/subscribe` — create subscription, charge wallet/card
- `GET /membership/status` — tier, renewal date, savings
- `POST /membership/cancel` — set cancelledAt to end of billing period

**Middleware** — in delivery service orders handler, check premium:
```typescript
// Before calculating deliveryFee:
const sub = await prisma.premiumSubscription.findUnique({
  where: { userId: order.customerId, status: 'active' }
});
const deliveryFee = sub ? 0 : calculateDeliveryFee(distance);
```

**BullMQ renewal job** — in `services/api/src/lib/` create `premiumRenewal.ts`:
```typescript
// Run daily: check subscriptions with nextRenewalAt <= tomorrow
// If wallet balance sufficient: debit + update nextRenewalAt
// If fails 3 times: update status to 'expired', send notification
```

---

### WAVE 6 — Personalised Home Screen & Bus Ticket Flow

#### Task 17 — Personalised Home Screen Overhaul

**The customer web home page** (`apps/customer-web/src/app/page.tsx`) already has a rich home screen. These components need to be added/fixed:

**17.1 Location selector** — add to top of home page:
```tsx
const [locality, setLocality] = useState('Colombo');
// Autocomplete input that calls GET /api/v1/cities?q=<input>
// On select: re-fetch vendors with locality param
```

**17.2 Wallet balance widget** — add to navigation bar:
```tsx
// Fetch GET /wallet/balance on page load
// Show: "LKR 2,450.00" → clicking navigates to /wallet
```

**17.3 AI prompt bar** — already exists as `UniversalSearch` component; extend it to also show AI suggestions tab.

**17.4 Quick Actions Row** — verify this exists in home page. If missing, add:
```tsx
const QUICK_ACTIONS = [
  { label: 'Food', icon: '🍕', href: '/search?category=restaurant' },
  { label: 'Grocery', icon: '🛒', href: '/search?category=grocery' },
  { label: 'Ride', icon: '🚗', href: '/ride' },
  { label: 'Bills', icon: '⚡', href: '/bills' },
  { label: 'Services', icon: '🔧', href: '/search?category=service' },
  { label: 'Pharmacy', icon: '💊', href: '/search?category=pharmacy' },
  { label: 'Health', icon: '🏥', href: '/health' },
  { label: 'Courier', icon: '📦', href: '/courier' },
];
```

**17.5 Context cards** — add time-aware cards:
```tsx
const hour = new Date().getHours();
const contextCards = [
  hour < 9 && { title: 'Morning commute?', subtitle: 'Get a bus ticket or ride', href: '/mobility', icon: '🚌' },
  activeOrders.length > 0 && { title: 'Order in progress', subtitle: `${activeOrders[0].status}`, href: `/orders/${activeOrders[0].id}/track`, icon: '📍' },
].filter(Boolean);
```

**17.8 Bottom Tab Bar** — for mobile web, add to layout:
```tsx
// Home | Search | Orders | Wallet | Profile
// Orders tab: show unread badge from GET /orders/unread-count
// Wallet tab: show balance
```

**17.9 Deep link handler** — add to `apps/mobile/app.json`:
```json
{
  "expo": {
    "scheme": "doorli",
    "intentFilters": [{ "action": "VIEW", "data": [{ "scheme": "doorli" }] }]
  }
}
```

---

#### Task 18 — Bus Ticket Booking (end-to-end)

This requires Task 11 (transit routes) to be complete first. Then build the UI:

**Web UI** — create `apps/customer-web/src/app/mobility/bus/page.tsx`:

```tsx
// Step 1: Route Search
// - From/To city autocomplete
// - Date picker
// - Calls GET /transit/bus/routes?q=&date=
// - Shows list of routes with bus operator, departure time, available seats, price

// Step 2: Schedule + Seat Selection
// - Departure time selector
// - Seat map grid (5 columns × N rows)
// - Available=green, Occupied=grey, Selected=blue
// - Calls GET /transit/bus/:routeId/seats?date=
// - Tapping seat: POST /transit/bus/seats/reserve (10-min TTL)
// - Countdown timer shows remaining reservation time

// Step 3: Payment
// - Selected seat + fare summary
// - Pay from Wallet button
// - POST /transit/bus/bookings with reservationToken

// Step 4: QR Ticket
// - Show QR code (offline-capable, stored in localStorage)
// - Route, seat, departure time, booking reference
// - Download/share button
```

**Mobile UI** — create `apps/mobile/app/(customer)/bus-ticket.tsx` with same flow using React Native.

**Offline QR** — after booking confirmed:
```typescript
// Web:
localStorage.setItem(`ticket_${bookingId}`, JSON.stringify(qrPayload));
// Mobile:
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem(`ticket_${bookingId}`, JSON.stringify(qrPayload));
```

---

### WAVE 7 — Mobile Production Builds (Task 8 — do last)

```bash
# 8.1: Update app.json
# iOS: "bundleIdentifier": "me.doorli.app"
# Android: "package": "me.doorli.app"

# 8.2: Configure eas.json
# "production" profile should read from .env.production

# 8.3-8.4: Build
npx eas build --platform ios --profile production
npx eas build --platform android --profile production

# 8.5: Submit
npx eas submit --platform ios
npx eas submit --platform android
```

**eas.json production profile** — `apps/mobile/eas.json`:
```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://doorli.me/api/v1",
        "EXPO_PUBLIC_AUTH_URL": "https://doorli.me"
      }
    }
  }
}
```

---

## 🔑 Environment Variables (all required for production)

```bash
# Core
DATABASE_URL=postgresql://doorli_user:PASSWORD@localhost:5432/doorli_db?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generate: openssl rand -hex 32>
ERP_INTERNAL_SECRET=<shared with Enterprise OS>

# OCI specific (use localhost:5433 on OCI)
# DATABASE_URL=postgresql://doorli_user:PASSWORD@localhost:5433/doorli_db?schema=public

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=

# SMS
MSG91_API_KEY=
MSG91_FLOW_ID=
# OR Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# Push Notifications
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FCM_SERVER_KEY=

# Maps
GOOGLE_MAPS_API_KEY=

# Storage
AWS_S3_BUCKET=doorli-media
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
# OR MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

# Email
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# Monitoring
SENTRY_DSN=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ERP
ERP_EMBEDDED_URL=http://127.0.0.1:3010/api/internal
ERP_ENTERPRISE_URL=https://enterprise.doorli.me/api/method/doorli_core.api.create_order

# Transit QR (new)
QR_HMAC_SECRET=<generate: openssl rand -hex 32>
```

---

## 🏛️ Architecture Overview

```
Clients (Customer Web :3000, Vendor Web :3002, Super Admin :3005, Mobile App)
    ↓
API Gateway :4000 (Express, Helmet, CORS, Rate Limit)
    ↓ proxies ↓                    ↓ serves directly ↓
Auth :4001     Delivery :4002      Vendors, Products, Bookings,
Ride :8085     Search :4004        Service Requests, Events,
Storage :4005  AI :4006            Forums, Emergency, GovTech,
Notifications :4007               Promos, Loyalty, Subscriptions,
Forum :8087                        Rides, Admin, ERP-Webhooks,
Emergency :8088                    Wallet, Bills, Transit, Health,
Gov :8089                          Courier, Community, Membership

Data Layer:
  PostgreSQL 16 + PostGIS (Prisma ORM)
  Redis 7 (BullMQ + Socket.io adapter + seat reservation)
  Elasticsearch 8 (vendor search + biller search)
  MinIO / S3 (files, prescriptions, proof-of-delivery)

ERP Layer:
  apps/erp (Next.js + Drizzle, erpProvider=simple)
  Frappe/ERPNext at enterprise.doorli.me (erpProvider=enterprise)
  Integration: POST /api/v1/erp-webhooks/*
```

---

## 📊 Database Schema — New Models Needed

Beyond what's already in `packages/db/prisma/schema.prisma`, these models need to be added:

| Model | Phase | Fields summary |
|-------|-------|---------------|
| `WalletAccount` | Task 9 | userId, balance, currency, kycLevel, dailyLimit |
| `LedgerEntry` | Task 9 | walletId, type, amount, balanceBefore, balanceAfter, idempotencyKey |
| `WalletTransfer` | Task 9 | fromUserId, toUserId, amount, idempotencyKey |
| `Biller` | Task 10 | name, type, apiCode, isActive |
| `BillPayment` | Task 10 | userId, billerId, amount, accountRef, status, txnRef |
| `AutoPayReminder` | Task 10 | userId, billerId, accountRef, dueDay, isActive |
| `TransitRoute` | Task 11 | origin, destination, type, fareMin, fareMax |
| `TransitTicket` | Task 11 | userId, routeId, seatNumber, qrPayload, departure, status |
| `IntercityBooking` | Task 11 | userId, routeId, seatNumber, qrPayload, bookingRef |
| `ParkingLot` | Task 11 | name, lat, lng, totalSpaces, availableSpaces |
| `ParkingReservation` | Task 11 | userId, lotId, startTime, endTime, amount |
| `HealthProvider` | Task 12 | name, type, specialty, lat, lng |
| `Appointment` | Task 12 | userId, providerId, slotTime (unique per provider) |
| `LabOrder` | Task 12 | userId, providerId, collectionSlot, status |
| `MedicineOrder` | Task 12 | userId, prescriptionUrl, items, status |
| `NursingBooking` | Task 12 | userId, providerId, visitDate, duration |
| `ClassBooking` | Task 12 | userId, classId, maxParticipants |
| `CourierJob` | Task 13 | customerId, runnerId, type, status, pickupAddr, dropoffAddr |
| `CommunityPost` | Task 14 | userId, type, content, locality, isDeleted |
| `InterestGroup` | Task 14 | name, locality, description |
| `GroupMembership` | Task 14 | groupId, userId |
| `ModerationFlag` | Task 14 | postId, userId, reason |
| `AISession` | Task 15 | userId, message, actionPlan, status |
| `AIActionLog` | Task 15 | sessionId, module, params, result, status |
| `PremiumSubscription` | Task 16 | userId, tier, status, nextRenewalAt, totalSavings |

**After adding each model, run:**
```bash
cd /Users/ahsan/Documents/myStartup/Doorli
npx prisma migrate dev --name <descriptive_name>
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test --workspace=@doorli/api
npm run test --workspace=@doorli/delivery

# E2E smoke (basic)
./scripts/smoke-oci.sh

# E2E authenticated
./scripts/e2e-smoke-authenticated.sh

# ERP callbacks
./scripts/verify-erp-callback.sh

# Stripe webhooks
./scripts/verify-stripe-webhook.sh

# DNS + TLS
./scripts/verify-dns-tls.sh

# Full production checklist
cat docs/production-checklist.md
```

---

## 📈 Revenue Model

| Stream | How | Rate |
|--------|-----|------|
| Order Commission | 8–15% on marketplace orders | Per transaction |
| Booking Commission | 10–15% on hotels/halls/health | Per booking |
| Delivery Fee | Distance-based | Per delivery |
| Mobility | Per ride / ticket markup | Per trip |
| Wallet Convenience | Small fee on bill payments | Per transaction |
| Vendor Subscription | Monthly featured listing | Flat fee |
| Premium Membership | LKR 299/month or LKR 2,499/year | Subscription |
| Event Package Margin | 5–10% on full event packages | Per event |

---

## 🔐 Security Notes

- JWT access tokens: 15 min TTL. Refresh tokens: 30 days, stored in HTTP-only cookie.
- All wallet mutations require idempotency key to prevent double-charges.
- ERP webhooks authenticated via `ERP_INTERNAL_SECRET` in `Authorization: Bearer` header.
- Stripe webhooks verified via signature (`STRIPE_WEBHOOK_SECRET`).
- QR tickets signed with HMAC-SHA256 using `QR_HMAC_SECRET`.
- Rate limiting: 500 req/15min per IP on API gateway.
- RBAC middleware on all protected routes via `authenticateToken` + `requireRole`.
- PCI: card details never touch our servers — Stripe.js on frontend, webhook-only backend.

---

## 📞 Contact

- **Author:** AHSAN MOHAMMED
- **Email:** ahsanmohammed828@gmail.com
- **Project:** Doorli — Everything Local. Delivered.
- **Website:** doorli.me
- **OCI IP:** 140.245.207.93

---

*Last updated: August 2026 — Full spec at `.kiro/specs/doorli-full-platform-completion/`*
