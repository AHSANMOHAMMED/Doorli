import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const billsRouter = Router();

// Seeded biller directory (in production stored in DB)
const BILLERS = [
  { id: 'dialog', name: 'Dialog Mobile', type: 'mobile', logo: '📱' },
  { id: 'mobitel', name: 'Mobitel', type: 'mobile', logo: '📱' },
  { id: 'airtel', name: 'Airtel', type: 'mobile', logo: '📱' },
  { id: 'ceb', name: 'CEB Electricity', type: 'electricity', logo: '⚡' },
  { id: 'leco', name: 'LECO', type: 'electricity', logo: '⚡' },
  { id: 'nws', name: 'National Water Supply', type: 'water', logo: '💧' },
  { id: 'laugfs', name: 'Laugfs Gas', type: 'gas', logo: '🔥' },
  { id: 'shell', name: 'Shell Gas', type: 'gas', logo: '🔥' },
  { id: 'slt', name: 'SLT Broadband', type: 'internet', logo: '🌐' },
  { id: 'dialog-bb', name: 'Dialog Broadband', type: 'internet', logo: '🌐' },
  { id: 'peotv', name: 'PEO TV (DTH)', type: 'dth', logo: '📺' },
  { id: 'dialog-tv', name: 'Dialog TV', type: 'dth', logo: '📺' },
  { id: 'fastag', name: 'FASTag', type: 'fastag', logo: '🛣️' },
];

async function ensureBiller(biller: typeof BILLERS[number]) {
  return prisma.biller.upsert({
    where: { id: biller.id },
    create: biller,
    update: { name: biller.name, type: biller.type, logo: biller.logo, isActive: true },
  });
}

function idempotencyKey(req: { headers: Record<string, unknown> }) {
  const value = req.headers['idempotency-key'];
  if (typeof value !== 'string' || !value.trim()) throw new AppError(400, 'A valid Idempotency-Key header is required');
  return value;
}

/** GET /billers/search?q= */
billsRouter.get('/billers/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').toLowerCase();
    const type = req.query.type as string | undefined;
    const results = BILLERS.filter(b =>
      (!q || b.name.toLowerCase().includes(q) || b.type.includes(q)) &&
      (!type || b.type === type)
    );
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

/** GET /billers/categories — all biller types */
billsRouter.get('/billers/categories', (_req, res) => {
  const categories = [...new Set(BILLERS.map(b => b.type))];
  res.json({ success: true, data: categories });
});

/** POST /bills/recharge — mobile/DTH recharge */
billsRouter.post('/bills/recharge', authenticateToken, async (req, res, next) => {
  try {
    const { billerId, accountRef, amount } = z.object({
      billerId: z.string(),
      accountRef: z.string().min(5),
      amount: z.number().positive(),
    }).parse(req.body);

    const biller = BILLERS.find(b => b.id === billerId);
    if (!biller) throw new AppError(404, 'Biller not found');
    if (!['mobile', 'dth', 'fastag'].includes(biller.type))
      throw new AppError(400, 'Use /bills/pay for utility bills');

    const key = idempotencyKey(req);
    const existing = await prisma.billPayment.findUnique({ where: { userId_idempotencyKey: { userId: req.user!.id, idempotencyKey: key } } });
    if (existing) return res.json({ success: true, data: { ...existing, amount: Number(existing.amount), replayed: true } });
    const persistedBiller = await ensureBiller(biller);
    const txnRef = `TXN-${req.user!.id.slice(0, 8)}-${Date.now()}`;
    // Debit only after a real biller provider confirms settlement.
    const payment = await prisma.billPayment.create({ data: { userId: req.user!.id, billerId: persistedBiller.id, accountRef, amount, type: biller.type, status: 'pending', reference: txnRef, idempotencyKey: key } });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: `${biller.name} Recharge Pending`,
        body: `LKR ${amount} recharge to ${accountRef} is queued. Ref: ${txnRef}`,
        type: 'bill_payment',
      },
    });

    res.status(202).json({ success: true, data: { ...payment, amount: Number(payment.amount), replayed: false } });
  } catch (err) { next(err); }
});

/** POST /bills/pay — utility bill payment */
billsRouter.post('/bills/pay', authenticateToken, async (req, res, next) => {
  try {
    const { billerId, accountRef, amount } = z.object({
      billerId: z.string(),
      accountRef: z.string().min(3),
      amount: z.number().positive(),
    }).parse(req.body);

    const biller = BILLERS.find(b => b.id === billerId);
    if (!biller) throw new AppError(404, 'Biller not found');

    const key = idempotencyKey(req);
    const existing = await prisma.billPayment.findUnique({ where: { userId_idempotencyKey: { userId: req.user!.id, idempotencyKey: key } } });
    if (existing) return res.json({ success: true, data: { ...existing, amount: Number(existing.amount), replayed: true } });
    const persistedBiller = await ensureBiller(biller);
    const txnRef = `BILL-${req.user!.id.slice(0, 8)}-${Date.now()}`;
    // Debit only after a real biller provider confirms settlement.
    const payment = await prisma.billPayment.create({ data: { userId: req.user!.id, billerId: persistedBiller.id, accountRef, amount, type: biller.type, status: 'pending', reference: txnRef, idempotencyKey: key } });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: `${biller.name} Payment Pending`,
        body: `LKR ${amount} payment for account ${accountRef} is queued. Ref: ${txnRef}`,
        type: 'bill_payment',
      },
    });

    res.status(202).json({ success: true, data: { ...payment, amount: Number(payment.amount), replayed: false } });
  } catch (err) { next(err); }
});

export default billsRouter;
