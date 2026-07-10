import { prisma } from '@doorli/db';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export async function createOrder(data: {
  customerId: string;
  vendorId: string;
  paymentMethod: PaymentMethod;
  deliveryAddressId?: string;
  deliveryAddress?: string; // Add string address
  specialInstructions?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}) {
  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryFee = 300; // Fixed fee for now
  const totalAmount = subtotal + deliveryFee;

  // Generate order number
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  let finalDeliveryAddressId = data.deliveryAddressId;
  if (!finalDeliveryAddressId && data.deliveryAddress) {
    const addr = await prisma.address.create({
      data: {
        userId: data.customerId,
        label: 'home',
        addressLine: data.deliveryAddress,
      }
    });
    finalDeliveryAddressId = addr.id;
  }

  return prisma.order.create({
    data: {
      orderNumber,
      customerId: data.customerId,
      vendorId: data.vendorId,
      deliveryAddressId: data.deliveryAddressId,
      paymentMethod: data.paymentMethod,
      specialInstructions: data.specialInstructions,
      subtotal,
      deliveryFee,
      totalAmount,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      vendor: {
        select: {
          id: true,
          businessName: true,
          addressLine: true,
        },
      },
    },
  });
}

export async function getOrdersByCustomer(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      vendor: {
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
        },
      },
    },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      vendor: {
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
          addressLine: true,
        },
      },
      deliveryAddress: true,
    },
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return prisma.order.update({
    where: { id },
    data: { status },
  });
}
