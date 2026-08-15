import { prisma, BookingStatus, BookingType } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';
import { enqueueNotification } from '../../lib/notifications.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventItem {
  vendorId?: string;
  serviceType: string;
  label: string;
  amount?: number;
  estimatedCost?: number;
}

// Budget and city stored in the items JSON as a __meta entry
interface EventMeta {
  __meta: true;
  budget?: number;
  city?: string;
}

export interface CreateEventInput {
  title: string;
  eventDate: string;
  guestCount?: number;
  budget?: number;
  city?: string;
  venueVendorId?: string;
  items?: EventItem[];
}

function extractMeta(items: unknown[]): EventMeta | null {
  return (items.find((i) => (i as EventMeta).__meta === true) as EventMeta) ?? null;
}

function extractItems(items: unknown[]): EventItem[] {
  return items.filter((i) => !(i as EventMeta).__meta) as EventItem[];
}

function buildItems(
  items: EventItem[],
  meta?: { budget?: number; city?: string }
): unknown[] {
  const result: unknown[] = [...items];
  if (meta?.budget !== undefined || meta?.city !== undefined) {
    result.unshift({ __meta: true, budget: meta?.budget, city: meta?.city } as EventMeta);
  }
  return result;
}

// ─── Create event package (Req 7.1) ──────────────────────────────────────────

export async function createEventPackage(customerId: string, input: CreateEventInput, idempotencyKey?: string) {
  if (new Date(input.eventDate) <= new Date()) throw new AppError(400, 'Event date must be in the future');
  if (idempotencyKey) {
    const existing = await prisma.eventPackage.findFirst({ where: { customerId, idempotencyKey } });
    if (existing) return existing;
  }
  const items: EventItem[] = input.items ?? [];
  const totalEstimate = items.reduce((s, i) => s + (i.amount ?? i.estimatedCost ?? 0), 0);

  const storedItems = buildItems(items, { budget: input.budget, city: input.city });

  const pkg = await prisma.eventPackage.create({
    data: {
      customerId,
      title: input.title,
      eventDate: new Date(input.eventDate),
      guestCount: input.guestCount,
      venueVendorId: input.venueVendorId,
      items: storedItems as any,
      totalEstimate,
      status: 'draft',
      idempotencyKey,
    },
  });

  return pkg;
}

// ─── Add vendor to event (Req 7.2) ───────────────────────────────────────────

export async function addVendorToEvent(
  eventId: string,
  customerId: string,
  vendorId: string,
  serviceType: string,
  amount: number
) {
  const pkg = await prisma.eventPackage.findUnique({ where: { id: eventId } });
  if (!pkg) throw new AppError(404, 'Event package not found');
  if (pkg.customerId !== customerId) throw new AppError(403, 'Access denied');
  if (pkg.status === 'confirmed' || pkg.status === 'cancelled') {
    throw new AppError(400, `Cannot modify a ${pkg.status} event`);
  }

  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new AppError(404, 'Vendor not found');

  const allStored = (pkg.items as unknown as (EventItem | EventMeta)[]) ?? [];
  const meta = extractMeta(allStored);
  const existingItems = extractItems(allStored);

  // Replace if same vendorId already present, otherwise append
  const alreadyExists = existingItems.some((i) => i.vendorId === vendorId);
  const updatedItems: EventItem[] = alreadyExists
    ? existingItems.map((i) =>
        i.vendorId === vendorId ? { ...i, serviceType, label: vendor.businessName, amount } : i
      )
    : [
        ...existingItems,
        {
          vendorId,
          serviceType,
          label: vendor.businessName,
          amount,
        },
      ];

  const totalEstimate = updatedItems.reduce((s, i) => s + (i.amount ?? i.estimatedCost ?? 0), 0);

  const storedItems = buildItems(updatedItems, meta ?? undefined);

  const updated = await prisma.eventPackage.update({
    where: { id: eventId },
    data: { items: storedItems as any, totalEstimate },
  });

  return updated;
}

// ─── Remove vendor from event (Req 7.3) ──────────────────────────────────────

export async function removeVendorFromEvent(
  eventId: string,
  customerId: string,
  vendorId: string
) {
  const pkg = await prisma.eventPackage.findUnique({ where: { id: eventId } });
  if (!pkg) throw new AppError(404, 'Event package not found');
  if (pkg.customerId !== customerId) throw new AppError(403, 'Access denied');
  if (pkg.status === 'confirmed' || pkg.status === 'cancelled') {
    throw new AppError(400, `Cannot modify a ${pkg.status} event`);
  }

  const allStored = (pkg.items as unknown as (EventItem | EventMeta)[]) ?? [];
  const meta = extractMeta(allStored);
  const existingItems = extractItems(allStored);

  const updatedItems = existingItems.filter((i) => i.vendorId !== vendorId);

  if (updatedItems.length === existingItems.length) {
    throw new AppError(404, 'Vendor not found in event items');
  }

  const totalEstimate = updatedItems.reduce((s, i) => s + (i.amount ?? i.estimatedCost ?? 0), 0);
  const storedItems = buildItems(updatedItems, meta ?? undefined);

  const updated = await prisma.eventPackage.update({
    where: { id: eventId },
    data: { items: storedItems as any, totalEstimate },
  });

  return updated;
}

// ─── Confirm event — create bookings (Req 7.4) ───────────────────────────────

export async function confirmEventPackage(eventId: string, customerId: string) {
  const pkg = await prisma.eventPackage.findUnique({ where: { id: eventId } });
  if (!pkg) throw new AppError(404, 'Event package not found');
  if (pkg.customerId !== customerId) throw new AppError(403, 'Access denied');
  if (pkg.status !== 'draft') {
    throw new AppError(400, `Event is already ${pkg.status}`);
  }

  const allStored = (pkg.items as unknown as (EventItem | EventMeta)[]) ?? [];
  const items = extractItems(allStored);

  if (items.length === 0) {
    throw new AppError(400, 'Cannot confirm event with no vendors');
  }

  const createdBookings = await prisma.$transaction(async (tx) => {
    const current = await tx.eventPackage.findUnique({ where: { id: eventId } });
    if (!current || current.status !== 'draft') throw new AppError(409, 'Event has already been confirmed');
    const bookings = [];
    for (const item of items) {
      if (!item.vendorId) continue;
      const booking = await tx.booking.create({ data: { bookingNumber: `EV${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, customerId, vendorId: item.vendorId, bookingType: BookingType.service, eventDate: pkg.eventDate, guestCount: pkg.guestCount, totalAmount: item.amount ?? item.estimatedCost ?? 0, requirements: `Event: ${pkg.title} | Role: ${item.serviceType}`, status: BookingStatus.confirmed }, include: { vendor: { select: { userId: true, businessName: true } } } });
      bookings.push(booking);
    }
    await tx.eventPackage.update({ where: { id: eventId }, data: { status: 'confirmed' } });
    return bookings;
  });
  const confirmed = await prisma.eventPackage.findUniqueOrThrow({ where: { id: eventId } });
  for (const booking of createdBookings) {
    await enqueueNotification({ userId: booking.vendor.userId, title: 'New event booking', body: `You have been booked for "${pkg.title}" on ${pkg.eventDate.toLocaleDateString()}`, type: 'event_booking_confirmed', data: { bookingId: booking.id, eventId: pkg.id } });
  }

  return { eventPackage: confirmed, bookings: createdBookings };
}

// ─── Event summary (Req 7.5, 7.6) ────────────────────────────────────────────

export async function getEventSummary(eventId: string, customerId: string) {
  const pkg = await prisma.eventPackage.findUnique({ where: { id: eventId } });
  if (!pkg) throw new AppError(404, 'Event package not found');
  if (pkg.customerId !== customerId) throw new AppError(403, 'Access denied');

  const allStored = (pkg.items as unknown as (EventItem | EventMeta)[]) ?? [];
  const meta = extractMeta(allStored);
  const items = extractItems(allStored);

  const totalSpend = items.reduce((s, i) => s + (i.amount ?? i.estimatedCost ?? 0), 0);
  const budget = meta?.budget ?? null;

  const budgetUsedPercent = budget && budget > 0 ? (totalSpend / budget) * 100 : null;
  const budgetWarning = budgetUsedPercent !== null && budgetUsedPercent > 80;

  // Build checklist: each item is either assigned (has vendorId) or not
  const checklist = items.map((item) => ({
    serviceType: item.serviceType,
    label: item.label,
    vendorId: item.vendorId ?? null,
    amount: item.amount ?? item.estimatedCost ?? 0,
    confirmed: !!item.vendorId,
  }));

  // Fetch vendor details for confirmed items
  const vendorIds = items.filter((i) => i.vendorId).map((i) => i.vendorId as string);
  const vendors = vendorIds.length
    ? await prisma.vendor.findMany({
        where: { id: { in: vendorIds } },
        select: { id: true, businessName: true, category: true, avgRating: true, phone: true },
      })
    : [];

  return {
    id: pkg.id,
    title: pkg.title,
    eventDate: pkg.eventDate,
    guestCount: pkg.guestCount,
    status: pkg.status,
    city: meta?.city ?? null,
    vendors,
    checklist,
    totalSpend,
    totalEstimate: pkg.totalEstimate,
    budget,
    budgetUsedPercent: budgetUsedPercent !== null ? Math.round(budgetUsedPercent) : null,
    budgetWarning,
    budgetWarningMessage: budgetWarning
      ? `Warning: ${Math.round(budgetUsedPercent!)}% of your budget has been allocated`
      : null,
  };
}

// ─── Customer's event packages (Req 7.5) ─────────────────────────────────────

export async function getMyEvents(customerId: string) {
  return prisma.eventPackage.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });
}
