import { prisma, BookingType, BookingStatus } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateBookingInput, UpdateBookingStatusInput } from './bookings.schema.js';

export async function createBooking(userId: string, input: CreateBookingInput) {
  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({
    where: { id: input.vendorId },
  });

  if (!vendor) {
    throw new AppError(404, 'Vendor not found');
  }

  // Generate booking number
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
      status: BookingStatus.pending,
    },
    include: {
      vendor: true,
      customer: true,
    },
  });

  // Emit notification to vendor
  // TODO: Implement Socket.io event emission

  return booking;
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

  // Emit notification to customer
  // TODO: Implement Socket.io event emission

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

  // Emit notifications
  // TODO: Implement Socket.io event emission

  return updated;
}
