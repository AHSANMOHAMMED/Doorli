import { prisma, BookingType, BookingStatus } from '@doorli/db';
import { Prisma } from '@doorli/db';
import { randomUUID } from 'node:crypto';
import { AppError } from '../../middleware/errorHandler.js';
import { getSocketServer } from '../../lib/socket.js';
import { enqueueNotification } from '../../lib/notifications.js';
import type { CreateBookingInput, UpdateBookingStatusInput } from './bookings.schema.js';

// ─── ERP calendar sync (Req 10.5, 5.3) ────────────────────────────────────────

const REQUEST_TIMEOUT_MS = 8000;

function erpSecret(): string {
  if (!process.env.ERP_INTERNAL_SECRET) {
    throw new Error('ERP_INTERNAL_SECRET environment variable is required');
  }
  return process.env.ERP_INTERNAL_SECRET.replace(/^Bearer\s+/i, '');
}

function embeddedBaseUrl(): string {
  return (
    process.env.ERP_EMBEDDED_URL ||
    process.env.ERP_API_URL ||
    process.env.ERP_SERVICE_URL ||
    'http://127.0.0.1:3010/api/internal'
  ).replace(/\/$/, '');
}

function enterpriseBaseUrl(): string | null {
  const url = process.env.ERP_ENTERPRISE_URL || '';
  return url ? url.replace(/\/$/, '') : null;
}

/**
 * Sync a confirmed booking to the vendor's ERP calendar.
 * - simple   → POST to ${ERP_EMBEDDED_URL}/api/internal/calendar-events
 * - enterprise → POST to Frappe Event resource API
 * Best-effort: logs failures but never throws (Req 10.5).
 */
export async function syncBookingToErpCalendar(bookingId: string): Promise<void> {
  let booking: Awaited<ReturnType<typeof prisma.booking.findUnique>> | null = null;
  try {
    booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vendor: {
          select: {
            erpProvider: true,
            erpTenantId: true,
          },
        },
        customer: { select: { fullName: true, phone: true } },
      },
    });
  } catch (err) {
    console.error('[booking-erp] DB fetch failed:', err instanceof Error ? err.message : err);
    return;
  }

  if (!booking) return;

  const { vendor } = booking as typeof booking & {
    vendor: { erpProvider: string; erpTenantId: string | null };
    customer: { fullName: string; phone: string | null };
  };

  if (vendor.erpProvider === 'none' || !vendor.erpTenantId) {
    // Vendor not linked to ERP — nothing to sync
    return;
  }

  const payload = {
    tenantId: vendor.erpTenantId,
    bookingId: booking.id,
    bookingNumber: booking.bookingNumber,
    bookingType: booking.bookingType,
    checkInDate: booking.checkInDate?.toISOString() ?? null,
    checkOutDate: booking.checkOutDate?.toISOString() ?? null,
    eventDate: booking.eventDate?.toISOString() ?? null,
    startTime: booking.startTime?.toISOString() ?? null,
    endTime: booking.endTime?.toISOString() ?? null,
    guestCount: booking.guestCount,
    totalAmount: Number(booking.totalAmount),
    requirements: booking.requirements,
    customerName: (booking as any).customer?.fullName ?? null,
    customerPhone: (booking as any).customer?.phone ?? null,
  };

  try {
    if (vendor.erpProvider === 'enterprise') {
      const baseUrl = enterpriseBaseUrl();
      if (!baseUrl) {
        console.warn('[booking-erp] ERP_ENTERPRISE_URL not configured — skipping calendar sync');
        return;
      }
      // Frappe Event resource endpoint
      const url = baseUrl.replace(/create_order$/, 'create_event');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Doorli-Secret': erpSecret(),
        },
        body: JSON.stringify({
          company: vendor.erpTenantId,
          ...payload,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        console.warn(`[booking-erp] enterprise calendar sync rejected (${res.status}) for booking ${bookingId}`);
      } else {
        console.log(`[booking-erp] synced booking ${bookingId} to enterprise ERP calendar`);
      }
    } else {
      // simple (embedded ERP)
      const url = `${embeddedBaseUrl()}/calendar-events`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': erpSecret(),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        console.warn(`[booking-erp] embedded calendar sync rejected (${res.status}) for booking ${bookingId}`);
      } else {
        console.log(`[booking-erp] synced booking ${bookingId} to embedded ERP calendar`);
      }
    }
  } catch (err) {
    // Best-effort — log but do not surface to caller
    console.error('[booking-erp] calendar sync error:', err instanceof Error ? err.message : err);
  }
}

export async function createBooking(userId: string, input: CreateBookingInput) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: input.vendorId },
  });

  if (!vendor) {
    throw new AppError(404, 'Vendor not found');
  }

  const idempotencyKey = (input as CreateBookingInput & { idempotencyKey?: string }).idempotencyKey;
  if (idempotencyKey) {
    const existing = await prisma.booking.findFirst({ where: { customerId: userId, idempotencyKey } });
    if (existing) return existing;
  }

  let hotelRoom: Awaited<ReturnType<typeof prisma.hotelRoom.findFirst>> = null;
  let hallSlot: Awaited<ReturnType<typeof prisma.hallSlot.findFirst>> = null;
  let beautyService: Awaited<ReturnType<typeof prisma.beautyService.findFirst>> = null;
  if (input.bookingType === 'hotel') {
    if (!input.checkInDate || !input.checkOutDate) throw new AppError(400, 'Hotel check-in and check-out dates are required');
    const checkIn = new Date(input.checkInDate);
    const checkOut = new Date(input.checkOutDate);
    if (!(checkIn < checkOut)) throw new AppError(400, 'Check-out must be after check-in');
    hotelRoom = await prisma.hotelRoom.findFirst({ where: { vendorId: input.vendorId, isActive: true, ...(input.roomId ? { id: input.roomId } : input.roomType ? { roomType: input.roomType } : {}) } });
    if (!hotelRoom) throw new AppError(404, 'Hotel room type is not available');
    if (input.guestCount && input.guestCount > hotelRoom.capacity) throw new AppError(400, 'Guest count exceeds room capacity');
  }
  if (input.bookingType === 'hall') {
    if (!input.eventDate) throw new AppError(400, 'Hall event date is required');
    hallSlot = await prisma.hallSlot.findFirst({ where: { id: input.hallSlotId, vendorId: input.vendorId, isActive: true } });
    if (!hallSlot) throw new AppError(404, 'Hall slot is not available');
    if (input.guestCount && input.guestCount > hallSlot.capacity) throw new AppError(400, 'Guest count exceeds hall capacity');
  }
  if (input.bookingType === 'beauty') {
    if (!input.eventDate || !input.startTime || !input.endTime) throw new AppError(400, 'Beauty date, start time, and end time are required');
    beautyService = await prisma.beautyService.findFirst({ where: { id: input.beautyServiceId, vendorId: input.vendorId, isActive: true } });
    if (!beautyService) throw new AppError(404, 'Beauty service is not available');
    const duration = new Date(input.endTime).getTime() - new Date(input.startTime).getTime();
    if (!Number.isFinite(duration) || duration < beautyService.durationMins * 60000) throw new AppError(400, 'Selected time range is shorter than the service duration');
  }

  // Beauty / hall slot conflict check
  if (input.startTime && input.endTime && input.eventDate) {
    const day = new Date(input.eventDate);
    const conflict = await prisma.booking.findFirst({
      where: {
        vendorId: input.vendorId,
        status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
        eventDate: day,
        startTime: { lt: new Date(input.endTime) },
        endTime: { gt: new Date(input.startTime) },
      },
    });
    if (conflict) {
      throw new AppError(409, 'Time slot unavailable');
    }
  }

  // Non-inventory hotel bookings retain the generic overlap check for legacy callers.
  if (input.bookingType !== 'hotel' && input.checkInDate && input.checkOutDate) {
    const conflict = await prisma.booking.findFirst({
      where: {
        vendorId: input.vendorId,
        bookingType: BookingType.hotel,
        status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
        checkInDate: { lt: new Date(input.checkOutDate) },
        checkOutDate: { gt: new Date(input.checkInDate) },
      },
    });
    if (conflict) {
      throw new AppError(409, 'Dates unavailable');
    }
  }

  const bookingNumber = `BK${Date.now().toString().slice(-8)}${randomUUID().slice(0, 4).toUpperCase()}`;

  const bookingData = {
      bookingNumber,
      customerId: userId,
      vendorId: input.vendorId,
      bookingType: input.bookingType as BookingType,
      checkInDate: input.checkInDate ? new Date(input.checkInDate) : null,
      checkOutDate: input.checkOutDate ? new Date(input.checkOutDate) : null,
      eventDate: input.eventDate ? new Date(input.eventDate) : null,
      startTime: input.startTime ? new Date(input.startTime) : null,
      endTime: input.endTime ? new Date(input.endTime) : null,
      guestCount: input.guestCount,
      totalAmount: hotelRoom
        ? Number(hotelRoom.price) * Math.ceil((new Date(input.checkOutDate!).getTime() - new Date(input.checkInDate!).getTime()) / 86400000)
        : hallSlot
          ? Number(hallSlot.price)
          : beautyService
            ? Number(beautyService.price)
            : input.totalAmount,
      depositAmount: input.depositAmount,
      requirements: input.requirements,
      durationMins: (input as { durationMins?: number }).durationMins,
      roomType: hotelRoom?.roomType ?? (input as { roomType?: string }).roomType,
      roomId: hotelRoom?.id,
      hallSlotId: hallSlot?.id,
      beautyServiceId: beautyService?.id,
      idempotencyKey,
      status: BookingStatus.pending,
    };
  const booking = hotelRoom
    ? await prisma.$transaction(async (tx) => {
      const occupied = await tx.booking.count({ where: { roomId: hotelRoom!.id, status: { in: [BookingStatus.pending, BookingStatus.confirmed] }, checkInDate: { lt: new Date(input.checkOutDate!) }, checkOutDate: { gt: new Date(input.checkInDate!) } } });
      if (occupied >= hotelRoom!.totalRooms) throw new AppError(409, 'No rooms available for those dates');
      return tx.booking.create({ data: bookingData, include: { vendor: true, customer: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    : hallSlot
    ? await prisma.$transaction(async (tx) => {
      const occupied = await tx.booking.count({ where: { hallSlotId: hallSlot!.id, status: { in: [BookingStatus.pending, BookingStatus.confirmed] }, eventDate: new Date(input.eventDate!) } });
      if (occupied > 0) throw new AppError(409, 'Hall slot is already booked for that date');
      return tx.booking.create({ data: bookingData, include: { vendor: true, customer: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    : await prisma.booking.create({ data: bookingData, include: { vendor: true, customer: true } });
  const hydratedBooking = booking;

  const deposit = Number(input.depositAmount ?? 0);
  let payment = null;
  if (deposit > 0) {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY to process deposit payments.');
      }
      const stripe = (await import('stripe')).default;
      const stripeInstance = new stripe(stripeSecretKey);
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(deposit * 100),
        currency: 'lkr',
        metadata: {
          bookingId: hydratedBooking.id,
          bookingNumber: hydratedBooking.bookingNumber,
        },
      });
      payment = {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      // Do not leave an inventory-consuming pending booking when its deposit
      // payment intent could not be created.
      await prisma.booking.delete({ where: { id: hydratedBooking.id } }).catch(() => undefined);
      throw error;
    }
  }

  const io = getSocketServer();
  io?.to(`vendor:${vendor.id}`).emit('booking:new', {
    bookingId: hydratedBooking.id,
    bookingNumber: hydratedBooking.bookingNumber,
  });

  await enqueueNotification({
    userId: vendor.userId,
    title: 'New booking',
    body: `Booking ${hydratedBooking.bookingNumber} received`,
    type: 'booking_new',
    data: { bookingId: hydratedBooking.id },
  });

  return { ...hydratedBooking, payment };
}

export async function getHotelRooms(vendorId: string, from?: string, to?: string) {
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, category: 'hotel' } });
  if (!vendor) throw new AppError(404, 'Hotel not found');
  const rooms = await prisma.hotelRoom.findMany({ where: { vendorId, isActive: true }, orderBy: { price: 'asc' } });
  if (!from || !to) return rooms.map((room) => ({ ...room, price: Number(room.price), availableRooms: room.totalRooms }));
  const checkIn = new Date(from); const checkOut = new Date(to);
  if (!(checkIn < checkOut)) throw new AppError(400, 'Invalid stay dates');
  return Promise.all(rooms.map(async (room) => {
    const occupied = await prisma.booking.count({ where: { roomId: room.id, status: { in: [BookingStatus.pending, BookingStatus.confirmed] }, checkInDate: { lt: checkOut }, checkOutDate: { gt: checkIn } } });
    return { ...room, price: Number(room.price), availableRooms: Math.max(0, room.totalRooms - occupied) };
  }));
}

export async function createHotelRoom(vendorId: string, userId: string, role: string, input: { roomType: string; description?: string; capacity: number; totalRooms: number; price: number; amenities?: string[] }) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.category !== 'hotel') throw new AppError(404, 'Hotel not found');
  if (vendor.userId !== userId && role !== 'admin') throw new AppError(403, 'Access denied');
  return prisma.hotelRoom.upsert({ where: { vendorId_roomType: { vendorId, roomType: input.roomType } }, create: { vendorId, ...input }, update: { ...input, isActive: true } });
}

export async function getHallSlots(vendorId: string, eventDate?: string) {
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, category: 'hall' } });
  if (!vendor) throw new AppError(404, 'Hall venue not found');
  const slots = await prisma.hallSlot.findMany({ where: { vendorId, isActive: true }, orderBy: { price: 'asc' } });
  return Promise.all(slots.map(async (slot) => {
    const booked = eventDate ? await prisma.booking.count({ where: { hallSlotId: slot.id, eventDate: new Date(eventDate), status: { in: [BookingStatus.pending, BookingStatus.confirmed] } } }) : 0;
    return { ...slot, price: Number(slot.price), available: booked === 0 };
  }));
}

export async function createHallSlot(vendorId: string, userId: string, role: string, input: { name: string; slotType: string; capacity: number; price: number; amenities?: string[] }) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.category !== 'hall') throw new AppError(404, 'Hall venue not found');
  if (vendor.userId !== userId && role !== 'admin') throw new AppError(403, 'Access denied');
  return prisma.hallSlot.upsert({ where: { vendorId_name: { vendorId, name: input.name } }, create: { vendorId, ...input }, update: { ...input, isActive: true } });
}

export async function getBeautyServices(vendorId: string) {
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, category: 'beauty' } });
  if (!vendor) throw new AppError(404, 'Beauty provider not found');
  const services = await prisma.beautyService.findMany({ where: { vendorId, isActive: true }, orderBy: { price: 'asc' } });
  return services.map((service) => ({ ...service, price: Number(service.price) }));
}

export async function createBeautyService(vendorId: string, userId: string, role: string, input: { name: string; description?: string; durationMins: number; price: number }) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.category !== 'beauty') throw new AppError(404, 'Beauty provider not found');
  if (vendor.userId !== userId && role !== 'admin') throw new AppError(403, 'Access denied');
  return prisma.beautyService.upsert({ where: { vendorId_name: { vendorId, name: input.name } }, create: { vendorId, ...input }, update: { ...input, isActive: true } });
}

export async function getAvailability(vendorId: string, from: string, to: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      vendorId,
      status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
      OR: [
        {
          checkInDate: { lte: new Date(to) },
          checkOutDate: { gte: new Date(from) },
        },
        {
          eventDate: { gte: new Date(from), lte: new Date(to) },
        },
      ],
    },
    select: {
      id: true,
      checkInDate: true,
      checkOutDate: true,
      eventDate: true,
      startTime: true,
      endTime: true,
      status: true,
      bookingType: true,
    },
  });
  return bookings;
}

export async function getBookingById(bookingId: string, userId: string, userRole: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      vendor: true,
      customer: true,
    },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (userRole === 'admin') return booking;

  if (userRole === 'customer' && booking.customerId !== userId) {
    throw new AppError(403, 'Access denied');
  }

  if (userRole === 'vendor' && booking.vendor.userId !== userId) {
    throw new AppError(403, 'Access denied');
  }

  return booking;
}

export async function getUserBookings(userId: string) {
  return prisma.booking.findMany({
    where: { customerId: userId },
    include: {
      vendor: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getVendorBookings(vendorId: string) {
  const bookings = await prisma.booking.findMany({
    where: { vendorId },
    include: {
      customer: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by month (YYYY-MM) for calendar view
  const grouped: Record<string, typeof bookings> = {};
  for (const booking of bookings) {
    const d = booking.eventDate ?? booking.checkInDate ?? booking.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(booking);
  }

  return grouped;
}

export async function updateBookingStatus(
  bookingId: string,
  input: UpdateBookingStatusInput,
  vendorUserId: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vendor: { select: { userId: true } } },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (booking.vendor.userId !== vendorUserId) {
    throw new AppError(403, 'Access denied');
  }

  // Validate status transitions
  const allowedTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'rejected', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
    rejected: [],
  };

  const allowed = allowedTransitions[booking.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw new AppError(
      400,
      `Cannot transition booking from ${booking.status} to ${input.status}`
    );
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: input.status as BookingStatus,
    },
    include: {
      vendor: true,
      customer: true,
    },
  });

  const io = getSocketServer();
  io?.to(`customer:${booking.customerId}`).emit('booking:status_update', {
    bookingId: updated.id,
    status: updated.status,
  });

  const statusMessages: Record<string, string> = {
    confirmed: 'Your booking has been confirmed',
    rejected: 'Your booking has been rejected',
    completed: 'Your booking has been marked as completed',
    cancelled: 'Your booking has been cancelled',
  };

  await enqueueNotification({
    userId: booking.customerId,
    title: 'Booking update',
    body: statusMessages[input.status] ?? `Booking ${booking.bookingNumber} is now ${input.status}`,
    type: 'booking_status',
    data: { bookingId: booking.id, status: input.status },
  });

  // Req 10.5, 5.3: sync confirmed bookings to the vendor's ERP calendar (fire-and-forget)
  if (input.status === 'confirmed') {
    void syncBookingToErpCalendar(bookingId).catch((err) =>
      console.error('[bookings] ERP calendar sync failed:', err),
    );
  }

  return updated;
}

export async function cancelBooking(bookingId: string, userId: string, userRole: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vendor: { select: { userId: true } } },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // Customers may only cancel pending/confirmed bookings
  if (userRole === 'customer') {
    if (booking.customerId !== userId) {
      throw new AppError(403, 'Access denied');
    }
    if (
      booking.status !== BookingStatus.pending &&
      booking.status !== BookingStatus.confirmed
    ) {
      throw new AppError(400, `Cannot cancel booking in status ${booking.status}`);
    }
  }

  if (booking.status === BookingStatus.completed) {
    throw new AppError(400, 'Cannot cancel completed booking');
  }

  // Cancellation policy: determine refund based on eventDate / checkInDate proximity
  const eventDateTime = booking.eventDate ?? booking.checkInDate;
  const hoursUntilEvent = eventDateTime
    ? (eventDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
    : null;

  let refundPolicy: 'no_refund' | 'partial_50' | 'full' = 'full';
  if (hoursUntilEvent !== null) {
    if (hoursUntilEvent < 24) {
      refundPolicy = 'no_refund';
    } else {
      refundPolicy = 'partial_50';
    }
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.cancelled },
    include: {
      vendor: { select: { userId: true } },
      customer: true,
    },
  });

  const io = getSocketServer();
  // Notify vendor
  io?.to(`vendor:${booking.vendorId}`).emit('booking:cancelled', { bookingId: booking.id });
  await enqueueNotification({
    userId: (booking as any).vendor.userId,
    title: 'Booking cancelled',
    body: `Booking ${booking.bookingNumber} was cancelled by the customer`,
    type: 'booking_cancelled',
    data: { bookingId: booking.id },
  });

  // Notify customer with refund info
  const refundMessage =
    refundPolicy === 'no_refund'
      ? 'No refund applies (event within 24 hours).'
      : refundPolicy === 'partial_50'
        ? '50% refund has been initiated.'
        : 'Full refund has been initiated.';

  io?.to(`customer:${booking.customerId}`).emit('booking:cancelled', {
    bookingId: booking.id,
    refundPolicy,
  });
  await enqueueNotification({
    userId: booking.customerId,
    title: 'Booking cancelled',
    body: `Booking ${booking.bookingNumber} cancelled. ${refundMessage}`,
    type: 'booking_cancelled',
    data: { bookingId: booking.id, refundPolicy },
  });

  return { ...updated, refundPolicy };
}
