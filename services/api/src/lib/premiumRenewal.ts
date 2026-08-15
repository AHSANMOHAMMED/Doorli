import { prisma } from '@doorli/db';
import { applyWalletTransaction } from '../modules/wallet/wallet.service.js';

const PRICE: Record<string, number> = { monthly: 299, annual: 2499 };

function addPeriod(date: Date, tier: string) {
  const next = new Date(date);
  if (tier === 'annual') next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

/** Renew due subscriptions; safe to run repeatedly from a daily scheduler. */
export async function renewPremiumSubscriptions(now = new Date()) {
  const due = await prisma.premiumSubscription.findMany({
    where: { status: 'active', nextRenewalAt: { lte: now }, cancelAt: null },
  });
  const results = [];
  for (const subscription of due) {
    const amount = PRICE[subscription.tier] ?? PRICE.monthly;
    try {
      const ledger = await applyWalletTransaction({
        userId: subscription.userId,
        amount: -amount,
        type: 'membership_renewal',
        idempotencyKey: `premium-renewal:${subscription.id}:${subscription.nextRenewalAt.toISOString()}`,
        description: `Doorli Premium ${subscription.tier} renewal`,
      });
      await prisma.premiumSubscription.update({ where: { id: subscription.id }, data: { nextRenewalAt: addPeriod(subscription.nextRenewalAt, subscription.tier) } });
      results.push({ id: subscription.id, status: ledger.replayed ? 'replayed' : 'renewed' });
    } catch (error) {
      await prisma.premiumSubscription.update({ where: { id: subscription.id }, data: { status: 'expired' } });
      await prisma.notification.create({ data: { userId: subscription.userId, title: 'Premium membership expired', body: 'Your Premium renewal could not be charged.', type: 'membership', data: { subscriptionId: subscription.id } } });
      results.push({ id: subscription.id, status: 'expired', error: error instanceof Error ? error.message : 'renewal failed' });
    }
  }
  return results;
}
