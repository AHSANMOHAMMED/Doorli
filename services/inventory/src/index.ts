import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BookingStatus, prisma } from '@doorli/db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.PORT || 4010);
const activeStatuses = { in: [BookingStatus.pending, BookingStatus.confirmed] };

app.get('/health/live', (_req, res) => {
  res.json({ status: 'ok', service: 'inventory' });
});

app.get('/api/v1/inventory/hotels/:vendorId/rooms', async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { id: req.params.vendorId, category: 'hotel' } });
    if (!vendor) return res.status(404).json({ success: false, error: 'Hotel not found' });
    const rooms = await prisma.hotelRoom.findMany({ where: { vendorId: vendor.id, isActive: true }, orderBy: { price: 'asc' } });
    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : null;
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : null;
    if (!from || !to) return res.json({ success: true, data: rooms.map((room) => ({ ...room, price: Number(room.price), availableRooms: room.totalRooms })) });
    if (!(from < to)) return res.status(400).json({ success: false, error: 'Invalid stay dates' });
    const data = await Promise.all(rooms.map(async (room) => {
      const occupied = await prisma.booking.count({ where: { roomId: room.id, status: activeStatuses, checkInDate: { lt: to }, checkOutDate: { gt: from } } });
      return { ...room, price: Number(room.price), availableRooms: Math.max(0, room.totalRooms - occupied) };
    }));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

app.get('/api/v1/inventory/halls/:vendorId/slots', async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { id: req.params.vendorId, category: 'hall' } });
    if (!vendor) return res.status(404).json({ success: false, error: 'Hall venue not found' });
    const slots = await prisma.hallSlot.findMany({ where: { vendorId: vendor.id, isActive: true }, orderBy: { price: 'asc' } });
    const eventDate = typeof req.query.eventDate === 'string' ? new Date(req.query.eventDate) : null;
    const data = await Promise.all(slots.map(async (slot) => {
      const booked = eventDate ? await prisma.booking.count({ where: { hallSlotId: slot.id, eventDate, status: activeStatuses } }) : 0;
      return { ...slot, price: Number(slot.price), available: booked === 0 };
    }));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

app.get('/api/v1/inventory/beauty/:vendorId/services', async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { id: req.params.vendorId, category: 'beauty' } });
    if (!vendor) return res.status(404).json({ success: false, error: 'Beauty provider not found' });
    const services = await prisma.beautyService.findMany({ where: { vendorId: vendor.id, isActive: true }, orderBy: { price: 'asc' } });
    res.json({ success: true, data: services.map((service) => ({ ...service, price: Number(service.price) })) });
  } catch (error) { next(error); }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[inventory]', error);
  res.status(500).json({ success: false, error: 'Inventory service unavailable' });
});

app.listen(port, () => console.log(`Inventory service listening on ${port}`));
