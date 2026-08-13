import { Router } from 'express';
import { z } from 'zod';
import { createHmac } from 'crypto';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import { getRedis } from '../../lib/redis.js';

const transitRouter = Router();

function generateQR(data: { routeId: string; seat: string; date: string; userId: string; ticketId: string }) {
  const payload = JSON.stringify({ ...data, iat: Date.now() });
  const secret = process.env.QR_HMAC_SECRET || 'doorli-qr-secret-change-in-prod';
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ payload, sig })).toString('base64');
}

// Seed routes (in production, stored in DB)
const ROUTES = [
  { id: 'r1', origin: 'Colombo', destination: 'Kandy', operator: 'SLTB', type: 'bus', fareMin: 250, fareMax: 400, departTimes: ['06:00', '08:30', '11:00', '14:00', '17:30'], totalSeats: 40 },
  { id: 'r2', origin: 'Colombo', destination: 'Galle', operator: 'CTB', type: 'bus', fareMin: 180, fareMax: 280, departTimes: ['07:00', '09:30', '12:00', '15:00', '18:00'], totalSeats: 40 },
  { id: 'r3', origin: 'Colombo', destination: 'Jaffna', operator: 'SLTB', type: 'bus', fareMin: 550, fareMax: 750, departTimes: ['05:30', '20:00'], totalSeats: 44 },
  { id: 'r4', origin: 'Colombo', destination: 'Matara', operator: 'Private', type: 'bus', fareMin: 220, fareMax: 320, departTimes: ['06:30', '10:00', '13:30', '16:30'], totalSeats: 40 },
];

/** GET /transit/bus/routes?q=&date= */
transitRouter.get('/bus/routes', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').toLowerCase();
    const results = ROUTES.filter(r =>
      !q || r.origin.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q)
    );
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

/** GET /transit/bus/:routeId/schedule?date= */
transitRouter.get('/bus/:routeId/schedule', async (req, res, next) => {
  try {
    const route = ROUTES.find(r => r.id === req.params.routeId);
    if (!route) throw new AppError(404, 'Route not found');
    const date = String(req.query.date || new Date().toISOString().slice(0, 10));
    const redis = getRedis();
    const schedules = await Promise.all(
      route.departTimes.map(async (time) => {
        const key = `seats:${route.id}:${date}:${time}`;
        const reservedRaw = await redis.get(key);
        const reserved = reservedRaw ? JSON.parse(reservedRaw) : [];
        return { time, fare: route.fareMin, totalSeats: route.totalSeats, reservedSeats: reserved.length, availableSeats: route.totalSeats - reserved.length };
      })
    );
    res.json({ success: true, data: schedules });
  } catch (err) { next(err); }
});

/** GET /transit/bus/:routeId/seats?date=&time= */
transitRouter.get('/bus/:routeId/seats', async (req, res, next) => {
  try {
    const route = ROUTES.find(r => r.id === req.params.routeId);
    if (!route) throw new AppError(404, 'Route not found');
    const date = String(req.query.date || new Date().toISOString().slice(0, 10));
    const time = String(req.query.time || route.departTimes[0]);
    const redis = getRedis();
    const key = `seats:${route.id}:${date}:${time}`;
    const reservedRaw = await redis.get(key);
    const reserved: string[] = reservedRaw ? JSON.parse(reservedRaw) : [];
    const seats = Array.from({ length: route.totalSeats }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return { number: num, state: reserved.includes(num) ? 'occupied' : 'available' };
    });
    res.json({ success: true, data: seats });
  } catch (err) { next(err); }
});

/** POST /transit/bus/seats/reserve — hold seat for 10 min */
transitRouter.post('/bus/seats/reserve', authenticateToken, async (req, res, next) => {
  try {
    const { routeId, date, time, seatNumber } = z.object({
      routeId: z.string(),
      date: z.string(),
      time: z.string(),
      seatNumber: z.string(),
    }).parse(req.body);

    const route = ROUTES.find(r => r.id === routeId);
    if (!route) throw new AppError(404, 'Route not found');

    const redis = getRedis();
    const key = `seats:${routeId}:${date}:${time}`;
    const reservedRaw = await redis.get(key);
    const reserved: string[] = reservedRaw ? JSON.parse(reservedRaw) : [];

    if (reserved.includes(seatNumber)) throw new AppError(409, 'Seat already reserved');

    reserved.push(seatNumber);
    await redis.setex(key, 7200, JSON.stringify(reserved)); // 2 hour TTL for seat map

    // Hold user's reservation token for 10 min
    const reservationToken = `RES:${routeId}:${date}:${time}:${seatNumber}:${req.user!.id}:${Date.now()}`;
    const tokenKey = `reservation:${Buffer.from(reservationToken).toString('base64').slice(0, 40)}`;
    await redis.setex(tokenKey, 600, JSON.stringify({ routeId, date, time, seatNumber, userId: req.user!.id }));

    res.json({ success: true, data: { reservationToken: tokenKey, expiresInSeconds: 600, seatNumber } });
  } catch (err) { next(err); }
});

/** POST /transit/bus/bookings — confirm booking */
transitRouter.post('/bus/bookings', authenticateToken, async (req, res, next) => {
  try {
    const { reservationToken } = z.object({ reservationToken: z.string() }).parse(req.body);

    const redis = getRedis();
    const raw = await redis.get(reservationToken);
    if (!raw) throw new AppError(400, 'Reservation expired or invalid. Please select your seat again.');

    const { routeId, date, time, seatNumber, userId } = JSON.parse(raw);
    if (userId !== req.user!.id) throw new AppError(403, 'This reservation belongs to another user');

    const route = ROUTES.find(r => r.id === routeId);
    if (!route) throw new AppError(404, 'Route not found');

    // Deduct from wallet
    const fare = route.fareMin;
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet || Number(wallet.balance) < fare)
      throw new AppError(400, 'Insufficient wallet balance');

    await prisma.wallet.update({ where: { userId: req.user!.id }, data: { balance: { decrement: fare } } });

    // Generate QR
    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const qrPayload = generateQR({ routeId, seat: seatNumber, date, userId: req.user!.id, ticketId });

    const bookingRef = `BUS${Date.now().toString().slice(-8)}`;

    // Delete reservation token
    await redis.del(reservationToken);

    // Send confirmation notification
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Bus Ticket Confirmed!',
        body: `${route.origin} → ${route.destination} | ${date} ${time} | Seat ${seatNumber} | Ref: ${bookingRef}`,
        type: 'transit_booking',
        data: { bookingRef, qrPayload, routeId, seatNumber, date, time },
      },
    });

    res.json({
      success: true,
      data: {
        bookingRef, ticketId, qrPayload,
        route: { from: route.origin, to: route.destination, operator: route.operator },
        seat: seatNumber, date, time, fare,
      },
    });
  } catch (err) { next(err); }
});

/** POST /transit/bus/tickets/validate — verify QR */
transitRouter.post('/bus/tickets/validate', async (req, res, next) => {
  try {
    const { qrPayload } = z.object({ qrPayload: z.string() }).parse(req.body);
    const decoded = JSON.parse(Buffer.from(qrPayload, 'base64').toString());
    const { payload, sig } = decoded;
    const secret = process.env.QR_HMAC_SECRET || 'doorli-qr-secret-change-in-prod';
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    const valid = sig === expected;
    const data = valid ? JSON.parse(payload) : null;
    res.json({ success: true, data: { valid, ticket: data } });
  } catch (err) { next(err); }
});

/** GET /transit/bus/tickets — user's tickets */
transitRouter.get('/bus/tickets', authenticateToken, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id, type: 'transit_booking' },
      orderBy: { sentAt: 'desc' },
      take: 20,
    });
    const tickets = notifications.map(n => ({
      id: n.id,
      bookingRef: (n.data as any)?.bookingRef,
      qrPayload: (n.data as any)?.qrPayload,
      routeId: (n.data as any)?.routeId,
      seatNumber: (n.data as any)?.seatNumber,
      date: (n.data as any)?.date,
      time: (n.data as any)?.time,
      title: n.title, body: n.body,
      createdAt: n.sentAt,
    }));
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
});

/** GET /transit/journey-plan?from=&to= — multi-modal planner */
transitRouter.get('/journey-plan', async (req, res, next) => {
  try {
    const { from, to } = req.query as { from: string; to: string };
    const route = ROUTES.find(r => r.origin.toLowerCase().includes(from?.toLowerCase()) && r.destination.toLowerCase().includes(to?.toLowerCase()));
    if (!route) return res.json({ success: true, data: { legs: [], message: 'No direct route found. Try ride-hailing.' } });
    const plan = {
      totalFare: route.fareMin,
      totalDurationMins: 120,
      legs: [
        { type: 'walk', from: 'Your location', to: `${route.origin} Bus Stand`, durationMins: 10, fare: 0 },
        { type: 'bus', from: route.origin, to: route.destination, operator: route.operator, durationMins: 100, fare: route.fareMin },
      ],
    };
    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
});

/** GET /transit/parking?lat=&lng= — nearby parking */
transitRouter.get('/parking', async (_req, res, next) => {
  try {
    const parkingLots = [
      { id: 'p1', name: 'Colombo Fort Parking', availableSpaces: 45, totalSpaces: 100, ratePerHour: 80, lat: 6.9344, lng: 79.8428 },
      { id: 'p2', name: 'Majestic City Parking', availableSpaces: 12, totalSpaces: 60, ratePerHour: 100, lat: 6.8915, lng: 79.8583 },
      { id: 'p3', name: 'One Galle Face Parking', availableSpaces: 30, totalSpaces: 150, ratePerHour: 120, lat: 6.9101, lng: 79.8469 },
    ];
    res.json({ success: true, data: parkingLots });
  } catch (err) { next(err); }
});

export default transitRouter;
