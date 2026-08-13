import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import { applyWalletTransaction } from '../wallet/wallet.service.js';

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

    const txnRef = `TXN${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ledger = await applyWalletTransaction({ userId: req.user!.id, amount: -amount, type: 'recharge', idempotencyKey: String(req.headers['idempotency-key'] || ''), reference: txnRef, description: `${biller.name} recharge`, metadata: { billerId, accountRef } });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: `${biller.name} Recharge Successful`,
        body: `LKR ${amount} recharge to ${accountRef}. Ref: ${txnRef}`,
        type: 'bill_payment',
      },
    });

    res.json({ success: true, data: { txnRef, biller: biller.name, accountRef, amount, status: 'success', transactionId: ledger.transaction.id, replayed: ledger.replayed } });
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

    const txnRef = `BILL${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ledger = await applyWalletTransaction({ userId: req.user!.id, amount: -amount, type: 'bill_payment', idempotencyKey: String(req.headers['idempotency-key'] || ''), reference: txnRef, description: `${biller.name} bill payment`, metadata: { billerId, accountRef } });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: `${biller.name} Payment Successful`,
        body: `LKR ${amount} paid for account ${accountRef}. Ref: ${txnRef}`,
        type: 'bill_payment',
      },
    });

    res.json({ success: true, data: { txnRef, biller: biller.name, accountRef, amount, status: 'success', transactionId: ledger.transaction.id, replayed: ledger.replayed } });
  } catch (err) { next(err); }
});

export default billsRouter;
