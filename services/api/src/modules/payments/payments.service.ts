import { prisma, PaymentMethod, PaymentStatus, PaymentReferenceType } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';
import type { InitiatePaymentInput, RefundPaymentInput } from './payments.schema.js';

// Placeholder payment gateway integrations
// In production, integrate with Stripe and PayHere SDKs

export async function initiatePayment(userId: string, input: InitiatePaymentInput) {
  // Verify reference exists (order or booking)
  if (input.referenceType === 'order') {
    const order = await prisma.order.findUnique({
      where: { id: input.referenceId },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.customerId !== userId) {
      throw new AppError(403, 'Access denied');
    }
  } else if (input.referenceType === 'booking') {
    const booking = await prisma.booking.findUnique({
      where: { id: input.referenceId },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.customerId !== userId) {
      throw new AppError(403, 'Access denied');
    }
  }

  // Check if payment already exists for this reference
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

  // Create payment record
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

  // Initiate payment with gateway
  let gatewayTransactionId: string | null = null;

  if (input.gateway === 'stripe') {
    // TODO: Integrate Stripe payment intent creation
    gatewayTransactionId = await createStripePaymentIntent(input.amount, input.referenceId);
  } else if (input.gateway === 'payhere') {
    // TODO: Integrate PayHere payment initiation
    gatewayTransactionId = await createPayHerePayment(input.amount, input.referenceId);
  }

  // Update payment with gateway transaction ID
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { gatewayTransactionId },
  });

  return updatedPayment;
}

export async function handleWebhook(gateway: string, payload: unknown, signature: string) {
  // Verify webhook signature
  const isValid = await verifyWebhookSignature(gateway, payload, signature);
  if (!isValid) {
    throw new AppError(401, 'Invalid webhook signature');
  }

  // Process webhook based on gateway
  if (gateway === 'stripe') {
    return await handleStripeWebhook(payload);
  } else if (gateway === 'payhere') {
    return await handlePayHereWebhook(payload);
  }

  throw new AppError(400, 'Unsupported gateway');
}

export async function refundPayment(paymentId: string, _input: RefundPaymentInput, userRole: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  if (payment.status !== PaymentStatus.paid) {
    throw new AppError(400, 'Can only refund paid payments');
  }

  if (userRole !== 'admin') {
    throw new AppError(403, 'Access denied');
  }

  // Process refund with gateway
  if (payment.gateway === 'stripe') {
    await refundStripePayment(payment.gatewayTransactionId!);
  } else if (payment.gateway === 'payhere') {
    await refundPayHerePayment(payment.gatewayTransactionId!);
  }

  // Update payment status
  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.refunded },
  });

  return updated;
}

export async function getPaymentById(paymentId: string, userId: string, userRole: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: true,
    },
  });

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  // Check access permissions
  if (userRole === 'customer' && payment.userId !== userId) {
    throw new AppError(403, 'Access denied');
  }

  return payment;
}

// Placeholder gateway integration functions
async function createStripePaymentIntent(_amount: number, _referenceId: string): Promise<string> {
  // TODO: Implement Stripe payment intent creation
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: Math.round(amount * 100),
  //   currency: 'lkr',
  //   metadata: { referenceId },
  // });
  // return paymentIntent.id;
  return `stripe_pi_${Date.now()}`;
}

async function createPayHerePayment(_amount: number, _referenceId: string): Promise<string> {
  // TODO: Implement PayHere payment initiation
  return `payhere_${Date.now()}`;
}

async function verifyWebhookSignature(_gateway: string, _payload: unknown, _signature: string): Promise<boolean> {
  // TODO: Implement webhook signature verification
  // For Stripe: stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  // For PayHere: verify HMAC signature
  return true;
}

async function handleStripeWebhook(_payload: unknown) {
  // TODO: Handle Stripe webhook events
  // payment_intent.succeeded -> mark payment as paid
  // payment_intent.payment_failed -> mark payment as failed
  return { success: true };
}

async function handlePayHereWebhook(_payload: unknown) {
  // TODO: Handle PayHere webhook events
  return { success: true };
}

async function refundStripePayment(_transactionId: string) {
  // TODO: Implement Stripe refund
}

async function refundPayHerePayment(_transactionId: string) {
  // TODO: Implement PayHere refund
}
