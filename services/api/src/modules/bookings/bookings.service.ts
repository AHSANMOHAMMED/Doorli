import { prisma, BookingType, BookingStatus } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';
import { getSocketServer } from '../../lib/socket.js';
import { enqueueNotification } from '../../lib/notifications.js';
import type { CreateBookingInput, UpdateBookingStatusInput } from './bookings.schema.js';

export async function createBooking(userId: string, input: CreateBookingInput) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: input.vendorId },
  });

  if (!vendor) {
    throw new AppError(404, 'Vendor not found');
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

  // Hotel date overlap
  if (input.checkInDate && input.checkOutDate) {
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

  const bookingNumber = `BK${Date.now().toString().slice(-8)}`;

  const booking = await prisma.booking.create({
    data: {
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
      totalAmount: input.totalAmount,
      depositAmount: input.depositAmount,
      requirements: input.requirements,
      durationMins: (input as { durationMins?: number }).durationMins,
      roomType: (input as { roomType?: string }).roomType,
      status: BookingStatus.pending,
    },
    include: {
      vendor: true,
      customer: true,
    },
  });

  const io = getSocketServer();
  io?.to(`vendor:${vendor.id}`).emit('booking:new', {
    bookingId: booking.id,
    bookingNumber: booking.bookingNumber,
  });

  await enqueueNotification({
    userId: vendor.userId,
    title: 'New booking',
    body: `Booking ${booking.bookingNumber} received`,
    type: 'booking_new',
    data: { bookingId: booking.id },
  });

  return booking;
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

  // Check access permissions
  if (userRole === 'customer' && booking.customerId !== userId) {
    throw new AppError(403, 'Access denied');
  }

  if (userRole === 'vendor' && booking.vendorId !== userId) {
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
  return prisma.booking.findMany({
    where: { vendorId },
    include: {
      customer: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateBookingStatus(
  bookingId: string,
  input: UpdateBookingStatusInput,
  vendorId: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (booking.vendorId !== vendorId) {
    throw new AppError(403, 'Access denied');
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

  await enqueueNotification({
    userId: booking.customerId,
    title: 'Booking update',
    body: `Booking ${booking.bookingNumber} is now ${input.status}`,
    type: 'booking_status',
    data: { bookingId: booking.id, status: input.status },
  });

  return updated;
}

export async function cancelBooking(bookingId: string, userId: string, userRole: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // Check access permissions
  if (userRole === 'customer' && booking.customerId !== userId) {
    throw new AppError(403, 'Access denied');
  }

  if (booking.status === BookingStatus.completed) {
    throw new AppError(400, 'Cannot cancel completed booking');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.cancelled },
    include: {
      vendor: true,
      customer: true,
    },
  });

  const io = getSocketServer();
  io?.to(`vendor:${booking.vendorId}`).emit('booking:cancelled', { bookingId: booking.id });
  await enqueueNotification({
    userId: booking.customerId,
    title: 'Booking cancelled',
    body: `Booking ${booking.bookingNumber} was cancelled`,
    type: 'booking_cancelled',
    data: { bookingId: booking.id },
  });

  return updated;
}
