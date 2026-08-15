import crypto from 'crypto';
import Stripe from 'stripe';
import { prisma, PaymentMethod, PaymentStatus, PaymentReferenceType } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';
import { PayHereIntegrationService } from '../../lib/payments.js';
import type { InitiatePaymentInput, RefundPaymentInput } from './payments.schema.js';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

async function requireStripe(): Promise<Stripe> {
  const stripe = getStripe();
  if (!stripe) throw new AppError(503, 'Stripe is not configured');
  return stripe;
}

async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, phone: true, fullName: true },
  });
  if (!user) throw new AppError(404, 'User not found');
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = await requireStripe();
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
    name: user.fullName,
    metadata: { doorliUserId: userId },
  });
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export function getPaymentConfig() {
  return { stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null };
}

export async function createSetupIntent(userId: string) {
  const stripe = await requireStripe();
  const customer = await getOrCreateStripeCustomer(userId);
  const intent = await stripe.setupIntents.create({
    customer,
    payment_method_types: ['card'],
    usage: 'off_session',
  });
  return { clientSecret: intent.client_secret };
}

export async function listSavedPaymentMethods(userId: string) {
  return prisma.savedPaymentMethod.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
}

export async function addSavedPaymentMethod(
  userId: string,
  input: { paymentMethodId: string; cardholderName?: string; setAsDefault?: boolean },
) {
  const stripe = await requireStripe();
  const customer = await getOrCreateStripeCustomer(userId);
  const stripeMethod = await stripe.paymentMethods.retrieve(input.paymentMethodId);
  const attachedCustomer = typeof stripeMethod.customer === 'string' ? stripeMethod.customer : stripeMethod.customer?.id;
  if (attachedCustomer !== customer) throw new AppError(400, 'Payment method is not attached to this customer');
  if (!stripeMethod.card) throw new AppError(400, 'Stripe did not return card details');
  const card = stripeMethod.card;

  return prisma.$transaction(async (transaction) => {
    const existingCount = await transaction.savedPaymentMethod.count({ where: { userId } });
    const isDefault = input.setAsDefault === true || existingCount === 0;
    if (isDefault) {
      await transaction.savedPaymentMethod.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return transaction.savedPaymentMethod.create({
      data: {
        userId,
        stripePaymentMethodId: stripeMethod.id,
        stripeCustomerId: customer,
        brand: card.brand,
        last4: card.last4,
        expMonth: card.exp_month,
        expYear: card.exp_year,
        cardholderName: input.cardholderName,
        fingerprint: card.fingerprint ?? undefined,
        isDefault,
      },
    });
  });
}

export async function deleteSavedPaymentMethod(userId: string, id: string) {
  const method = await prisma.savedPaymentMethod.findFirst({ where: { id, userId } });
  if (!method) throw new AppError(404, 'Payment method not found');
  const stripe = await requireStripe();
  await stripe.paymentMethods.detach(method.stripePaymentMethodId);
  await prisma.savedPaymentMethod.delete({ where: { id } });
  if (method.isDefault) {
    const replacement = await prisma.savedPaymentMethod.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (replacement) await prisma.savedPaymentMethod.update({ where: { id: replacement.id }, data: { isDefault: true } });
  }
  return { id };
}

export async function setDefaultSavedPaymentMethod(userId: string, id: string) {
  const method = await prisma.savedPaymentMethod.findFirst({ where: { id, userId } });
  if (!method) throw new AppError(404, 'Payment method not found');
  return prisma.$transaction(async (transaction) => {
    await transaction.savedPaymentMethod.updateMany({ where: { userId }, data: { isDefault: false } });
    return transaction.savedPaymentMethod.update({ where: { id }, data: { isDefault: true } });
  });
}

async function syncReferencePaymentStatus(
  referenceId: string,
  referenceType: PaymentReferenceType,
  status: PaymentStatus,
) {
  if (referenceType === PaymentReferenceType.order) {
    if (status === PaymentStatus.paid) {
      const { markOrderPaid } = await import('../orders/orders.service.js');
      await markOrderPaid(referenceId).catch((err) =>
        console.error('[payments] markOrderPaid side-effects failed', err),
      );
    } else {
      await prisma.order.update({
        where: { id: referenceId },
        data: { paymentStatus: status },
      });
    }
  } else if (referenceType === PaymentReferenceType.booking) {
    // Payment row is source of truth; confirm booking when deposit is paid
    if (status === PaymentStatus.paid) {
      await prisma.booking.update({
        where: { id: referenceId },
        data: { status: 'confirmed' },
      }).catch(() => undefined);
    }
  }
}

export async function initiatePayment(userId: string, input: InitiatePaymentInput) {
  if (input.referenceType === 'order') {
    const order = await prisma.order.findUnique({ where: { id: input.referenceId } });
    if (!order) throw new AppError(404, 'Order not found');
    if (order.customerId !== userId) throw new AppError(403, 'Access denied');
  } else if (input.referenceType === 'booking') {
    const booking = await prisma.booking.findUnique({ where: { id: input.referenceId } });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.customerId !== userId) throw new AppError(403, 'Access denied');
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      referenceId: input.referenceId,
      referenceType: input.referenceType as PaymentReferenceType,
      status: PaymentStatus.paid,
    },
  });

  if (existingPayment) {
    throw new AppError(400, 'Payment already completed for this reference');
  }

  // COD — pending until driver marks collected on delivery
  if (input.method === 'cod' || input.gateway === 'manual') {
    const payment = await prisma.payment.create({
      data: {
        referenceId: input.referenceId,
        referenceType: input.referenceType as PaymentReferenceType,
        userId,
        amount: input.amount,
        method: PaymentMethod.cod,
        gateway: 'manual',
        status: PaymentStatus.pending,
        gatewayTransactionId: `cod_${Date.now()}`,
      },
    });

    await syncReferencePaymentStatus(
      input.referenceId,
      input.referenceType as PaymentReferenceType,
      PaymentStatus.pending,
    );

    return {
      ...payment,
      clientSecret: null,
      payHere: null,
    };
  }

  // Wallet — deduct stored balance atomically and settle immediately (Req 16.4)
  if (input.method === 'wallet' || input.gateway === 'wallet') {
    const payment = await prisma.$transaction(async (tx) => {
      const debited = await tx.wallet.updateMany({
        where: { userId, balance: { gte: input.amount } },
        data: { balance: { decrement: input.amount } },
      });
      if (debited.count === 0) {
        throw new AppError(400, 'Insufficient wallet balance');
      }
      return tx.payment.create({
        data: {
          referenceId: input.referenceId,
          referenceType: input.referenceType as PaymentReferenceType,
          userId,
          amount: input.amount,
          method: PaymentMethod.wallet,
          gateway: 'wallet',
          status: PaymentStatus.paid,
          gatewayTransactionId: `wallet_${Date.now()}`,
        },
      });
    });

    await syncReferencePaymentStatus(
      input.referenceId,
      input.referenceType as PaymentReferenceType,
      PaymentStatus.paid,
    );

    return {
      ...payment,
      clientSecret: null,
      payHere: null,
    };
  }

  const payment = await prisma.payment.create({
    data: {
      referenceId: input.referenceId,
      referenceType: input.referenceType as PaymentReferenceType,
      userId,
      amount: input.amount,
      method: input.method as PaymentMethod,
      gateway: input.gateway,
      status: PaymentStatus.pending,
    },
  });

  let gatewayTransactionId: string | null = null;
  let clientSecret: string | null = null;
  let payHere: Record<string, string> | null = null;

  if (input.gateway === 'stripe') {
    const result = await createStripePaymentIntent(input.amount, input.referenceId, payment.id);
    gatewayTransactionId = result.id;
    clientSecret = result.clientSecret;
  } else if (input.gateway === 'payhere') {
    const result = await createPayHerePayment(input.amount, payment.id, input.referenceId);
    gatewayTransactionId = result.orderId;
    payHere = result.checkout;
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { gatewayTransactionId },
  });

  return {
    ...updatedPayment,
    clientSecret,
    payHere,
  };
}

/** Mark COD as collected (driver/vendor/admin). */
export async function collectCodPayment(paymentId: string, actorRole: string) {
  if (!['driver', 'vendor', 'admin'].includes(actorRole)) {
    throw new AppError(403, 'Access denied');
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new AppError(404, 'Payment not found');
  if (payment.method !== PaymentMethod.cod) {
    throw new AppError(400, 'Not a COD payment');
  }
  if (payment.status === PaymentStatus.paid) {
    return payment;
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.paid },
  });

  await syncReferencePaymentStatus(payment.referenceId, payment.referenceType, PaymentStatus.paid);
  return updated;
}

export async function handleWebhook(gateway: string, payload: unknown, signature: string, rawBody?: string | Buffer) {
  const isValid = await verifyWebhookSignature(gateway, payload, signature, rawBody);
  if (!isValid) {
    throw new AppError(401, 'Invalid webhook signature');
  }

  if (gateway === 'stripe') {
    return await handleStripeWebhook(payload);
  }
  if (gateway === 'payhere') {
    return await handlePayHereWebhook(payload);
  }

  throw new AppError(400, 'Unsupported gateway');
}

export async function refundPayment(paymentId: string, input: RefundPaymentInput, userRole: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new AppError(404, 'Payment not found');
  if (payment.status !== PaymentStatus.paid) {
    throw new AppError(400, 'Can only refund paid payments');
  }
  if (userRole !== 'admin') throw new AppError(403, 'Access denied');

  return executeRefund(payment.id, input.reason);
}

/** Gateway-aware refund without role checks — shared by admin refunds and order cancellation. */
async function executeRefund(paymentId: string, reason?: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new AppError(404, 'Payment not found');
  if (payment.status !== PaymentStatus.paid) {
    throw new AppError(400, 'Can only refund paid payments');
  }

  if (payment.gateway === 'stripe' && payment.gatewayTransactionId) {
    await refundStripePayment(payment.gatewayTransactionId, reason);
  } else if (payment.gateway === 'payhere' && payment.gatewayTransactionId) {
    await refundPayHerePayment(payment.gatewayTransactionId);
  } else if (payment.method === PaymentMethod.wallet) {
    // Credit the amount back to the customer's wallet
    await prisma.wallet.upsert({
      where: { userId: payment.userId },
      create: { userId: payment.userId, balance: payment.amount },
      update: { balance: { increment: payment.amount } },
    });
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.refunded },
  });

  await syncReferencePaymentStatus(
    payment.referenceId,
    payment.referenceType,
    PaymentStatus.refunded,
  );

  return updated;
}

/**
 * Refund every captured payment of an order (called on cancellation, Req 3.7).
 * COD payments are still pending at cancel time so nothing is refunded for them.
 */
export async function refundOrderPayments(orderId: string, reason?: string) {
  const payments = await prisma.payment.findMany({
    where: {
      referenceId: orderId,
      referenceType: PaymentReferenceType.order,
      status: PaymentStatus.paid,
    },
  });

  const refunded = [];
  for (const payment of payments) {
    refunded.push(await executeRefund(payment.id, reason));
  }
  return refunded;
}

/** Customer wallet balance (auto-creates an empty wallet). */
export async function getWallet(userId: string) {
  const wallet = await prisma.wallet.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  return { ...wallet, balance: Number(wallet.balance) };
}

export async function getPaymentById(paymentId: string, userId: string, userRole: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true },
  });

  if (!payment) throw new AppError(404, 'Payment not found');
  if (userRole === 'customer' && payment.userId !== userId) {
    throw new AppError(403, 'Access denied');
  }

  return payment;
}

export async function getPaymentByReference(referenceId: string, userId: string, userRole?: string) {
  const payment = await prisma.payment.findFirst({
    where: { referenceId },
    orderBy: { createdAt: 'desc' },
  });
  if (!payment) return null;
  if (userRole === 'customer' && payment.userId !== userId) {
    throw new AppError(403, 'Access denied');
  }
  return payment;
}

/** Driver/vendor/admin: find or create COD payment for an order, then mark paid. */
export async function collectCodForOrder(orderId: string, actorRole: string) {
  if (!['driver', 'vendor', 'admin'].includes(actorRole)) {
    throw new AppError(403, 'Access denied');
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');

  let payment = await prisma.payment.findFirst({
    where: {
      referenceId: orderId,
      referenceType: PaymentReferenceType.order,
      method: PaymentMethod.cod,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        referenceId: orderId,
        referenceType: PaymentReferenceType.order,
        userId: order.customerId,
        amount: order.totalAmount,
        method: PaymentMethod.cod,
        gateway: 'manual',
        status: PaymentStatus.pending,
        gatewayTransactionId: `cod_${Date.now()}`,
      },
    });
  }

  return collectCodPayment(payment.id, actorRole);
}

async function createStripePaymentIntent(
  amount: number,
  referenceId: string,
  paymentId: string,
): Promise<{ id: string; clientSecret: string | null }> {
  const stripe = getStripe();
  if (!stripe) {
    // Dev fallback when Stripe keys are not configured
    if (process.env.NODE_ENV === 'production') {
      throw new AppError(503, 'Stripe is not configured');
    }
    return {
      id: `stripe_pi_dev_${Date.now()}`,
      clientSecret: `pi_dev_secret_${paymentId}`,
    };
  }

  const currency = (process.env.STRIPE_CURRENCY || 'lkr').toLowerCase();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata: { referenceId, paymentId },
    automatic_payment_methods: { enabled: true },
  });

  return {
    id: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  };
}

async function createPayHerePayment(
  amount: number,
  paymentId: string,
  referenceId: string,
): Promise<{ orderId: string; checkout: Record<string, string> }> {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  if (!merchantId) {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError(503, 'PayHere is not configured');
    }
    return {
      orderId: `payhere_dev_${Date.now()}`,
      checkout: {
        merchant_id: 'sandbox',
        order_id: paymentId,
        amount: amount.toFixed(2),
        currency: 'LKR',
        hash: 'dev',
      },
    };
  }

  const hash = PayHereIntegrationService.generateHash(paymentId, amount, 'LKR');
  const checkout = {
    merchant_id: merchantId,
    return_url: process.env.PAYHERE_RETURN_URL || 'doorli://payment/success',
    cancel_url: process.env.PAYHERE_CANCEL_URL || 'doorli://payment/cancel',
    notify_url: process.env.PAYHERE_NOTIFY_URL || 'http://localhost:4000/api/v1/payments/webhook/payhere',
    order_id: paymentId,
    items: `Doorli payment ${referenceId}`,
    currency: 'LKR',
    amount: amount.toFixed(2),
    hash,
  };

  return { orderId: paymentId, checkout };
}

async function verifyWebhookSignature(
  gateway: string,
  payload: unknown,
  signature: string,
  rawBody?: string | Buffer,
): Promise<boolean> {
  if (gateway === 'stripe') {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      // Allow in development without webhook secret
      return process.env.NODE_ENV !== 'production';
    }
    const stripe = getStripe();
    if (!stripe) return false;
    try {
      const body = rawBody ?? JSON.stringify(payload);
      stripe.webhooks.constructEvent(body, signature, secret);
      return true;
    } catch {
      return false;
    }
  }

  if (gateway === 'payhere') {
    if (!process.env.PAYHERE_MERCHANT_SECRET) {
      return process.env.NODE_ENV !== 'production';
    }
    return PayHereIntegrationService.verifyPaymentCallback(payload as Record<string, string>);
  }

  return false;
}

async function markPaymentByGatewayId(gatewayTransactionId: string, status: PaymentStatus) {
  const payment = await prisma.payment.findFirst({
    where: { gatewayTransactionId },
  });
  if (!payment) {
    // PayHere uses payment.id as order_id
    const byId = await prisma.payment.findUnique({ where: { id: gatewayTransactionId } });
    if (!byId) return null;
    const updated = await prisma.payment.update({
      where: { id: byId.id },
      data: { status },
    });
    await syncReferencePaymentStatus(byId.referenceId, byId.referenceType, status);
    return updated;
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status },
  });
  await syncReferencePaymentStatus(payment.referenceId, payment.referenceType, status);
  return updated;
}

async function handleStripeWebhook(payload: unknown) {
  const event = payload as { type?: string; data?: { object?: { id?: string; metadata?: { paymentId?: string; walletTopupId?: string } } } };
  const type = event.type;
  const object = event.data?.object;
  const piId = object?.id;
  const paymentId = object?.metadata?.paymentId;
  const walletTopupId = object?.metadata?.walletTopupId;

  if (type === 'payment_intent.succeeded') {
    if (walletTopupId && piId) return settleWalletTopup(walletTopupId, piId);
    if (paymentId) {
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.paid, gatewayTransactionId: piId },
      });
      await syncReferencePaymentStatus(payment.referenceId, payment.referenceType, PaymentStatus.paid);
      return { success: true, paymentId: payment.id };
    }
    if (piId) {
      await markPaymentByGatewayId(piId, PaymentStatus.paid);
    }
  }

  if (type === 'payment_intent.payment_failed' && piId) {
    await markPaymentByGatewayId(piId, PaymentStatus.failed);
  }

  return { success: true };
}

async function settleWalletTopup(intentId: string, providerTransactionId: string) {
  return prisma.$transaction(async (tx) => {
    const intent = await tx.walletTopupIntent.findUnique({ where: { id: intentId } });
    if (!intent) throw new AppError(404, 'Wallet top-up intent not found');
    if (intent.status === 'paid') return { success: true, replayed: true, intentId };
    const key = `wallet-topup:${intent.id}`;
    const existing = await tx.walletTransaction.findUnique({ where: { userId_idempotencyKey: { userId: intent.userId, idempotencyKey: key } } });
    if (existing) {
      await tx.walletTopupIntent.update({ where: { id: intent.id }, data: { status: 'paid', providerTransactionId } });
      return { success: true, replayed: true, intentId };
    }
    const wallet = await tx.wallet.upsert({ where: { userId: intent.userId }, create: { userId: intent.userId, balance: 0 }, update: {} });
    const updatedWallet = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: intent.amount } } });
    const transaction = await tx.walletTransaction.create({ data: { walletId: wallet.id, userId: intent.userId, idempotencyKey: key, type: 'topup', amount: intent.amount, balanceAfter: updatedWallet.balance, currency: updatedWallet.currency, reference: providerTransactionId, description: 'Stripe wallet top-up', metadata: { topupIntentId: intent.id } } });
    await tx.walletJournalEntry.createMany({ data: [
      { transactionId: transaction.id, userId: intent.userId, accountRef: intent.userId, accountType: 'user_wallet', direction: 'credit', amount: intent.amount, currency: updatedWallet.currency, balanceBefore: Number(wallet.balance), balanceAfter: Number(updatedWallet.balance) },
      { transactionId: transaction.id, accountRef: 'platform:stripe', accountType: 'platform', direction: 'debit', amount: intent.amount, currency: updatedWallet.currency, balanceBefore: 0, balanceAfter: 0 },
    ] });
    await tx.walletTopupIntent.update({ where: { id: intent.id }, data: { status: 'paid', providerTransactionId } });
    return { success: true, replayed: false, intentId, transactionId: transaction.id };
  });
}

async function handlePayHereWebhook(payload: unknown) {
  const body = payload as { order_id?: string; status_code?: string | number };
  const orderId = body.order_id;
  if (!orderId) return { success: false };

  const statusCode = String(body.status_code);
  if (statusCode === '2') {
    await markPaymentByGatewayId(orderId, PaymentStatus.paid);
  } else if (statusCode === '-1' || statusCode === '0') {
    await markPaymentByGatewayId(orderId, PaymentStatus.failed);
  }

  return { success: true };
}

async function refundStripePayment(transactionId: string, reason?: string) {
  const stripe = getStripe();
  if (!stripe) {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError(503, 'Stripe is not configured');
    }
    return;
  }

  await stripe.refunds.create({
    payment_intent: transactionId,
    reason: reason ? 'requested_by_customer' : undefined,
  });
}

async function refundPayHerePayment(_transactionId: string) {
  // PayHere refunds are typically processed via merchant dashboard / support API.
  // Record refund locally; gateway call requires merchant API credentials.
  if (!process.env.PAYHERE_MERCHANT_ID && process.env.NODE_ENV === 'production') {
    throw new AppError(503, 'PayHere refunds require merchant configuration');
  }
}

/** Dev helper: confirm a pending Stripe/PayHere payment without webhook (non-production). */
export async function confirmPaymentDev(paymentId: string) {
  if (process.env.NODE_ENV === 'production') {
    throw new AppError(403, 'Not available in production');
  }
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new AppError(404, 'Payment not found');

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.paid },
  });
  await syncReferencePaymentStatus(payment.referenceId, payment.referenceType, PaymentStatus.paid);
  return updated;
}

export function generateIdempotencyKey(referenceId: string, amount: number): string {
  return crypto.createHash('sha256').update(`${referenceId}:${amount}`).digest('hex').slice(0, 32);
}
