import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { getSocketServer } from '../../lib/socket.js';

const courierRouter = Router();
courierRouter.use(authenticateToken);

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** POST /courier/jobs — create package/document delivery job */
courierRouter.post('/jobs', async (req, res, next) => {
  try {
    const body = z.object({
      type: z.enum(['package', 'document']).default('package'),
      pickupAddress: z.string().min(5),
      pickupLat: z.number(),
      pickupLng: z.number(),
      dropoffAddress: z.string().min(5),
      dropoffLat: z.number(),
      dropoffLng: z.number(),
      dimensions: z.object({ weight: z.number().optional(), size: z.string().optional() }).optional(),
      deliveryWindow: z.enum(['same_day', 'next_day']).default('same_day'),
      requiresSignature: z.boolean().default(false),
      notes: z.string().optional(),
    }).parse(req.body);

    const distKm = haversineKm(body.pickupLat, body.pickupLng, body.dropoffLat, body.dropoffLng);
    const fareEstimate = Math.round(150 + distKm * 60);

    const jobRef = `CJB${Date.now().toString().slice(-8)}`;

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: `${body.type === 'document' ? 'Document' : 'Package'} Pickup Scheduled`,
        body: `Runner assigned. Pickup from: ${body.pickupAddress}. Est. fare: LKR ${fareEstimate}`,
        type: 'courier_job',
        data: { ...body, jobRef, fareEstimate, distKm: Number(distKm.toFixed(2)), status: 'pending' },
      },
    });

    // Emit WebSocket event to notify available runners
    try {
      getSocketServer()?.emit('courier:new_job', { jobRef, type: body.type, pickupLat: body.pickupLat, pickupLng: body.pickupLng, fareEstimate });
    } catch { /* socket optional */ }

    res.status(201).json({ success: true, data: { jobRef, fareEstimate, distKm: Number(distKm.toFixed(2)), status: 'pending' } });
  } catch (err) { next(err); }
});

/** GET /courier/jobs/my — user's courier jobs */
courierRouter.get('/jobs/my', async (req, res, next) => {
  try {
    const jobs = await prisma.notification.findMany({
      where: { userId: req.user!.id, type: 'courier_job' },
      orderBy: { sentAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: jobs.map(j => ({ id: j.id, ...((j.data as Record<string, unknown>) ?? {}), title: j.title })) });
  } catch (err) { next(err); }
});

export default courierRouter;

const errandsRouter = Router();
errandsRouter.use(authenticateToken);

/** POST /errands/queue-pick — send someone to queue */
errandsRouter.post('/queue-pick', async (req, res, next) => {
  try {
    const body = z.object({
      locationName: z.string().min(3),
      lat: z.number(),
      lng: z.number(),
      estimatedWaitMinutes: z.number().int().min(5).max(240),
      notes: z.string().optional(),
    }).parse(req.body);

    const fareEstimate = Math.round(200 + body.estimatedWaitMinutes * 3);
    const jobRef = `QPK${Date.now().toString().slice(-8)}`;

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Queue Picker Assigned',
        body: `Runner will queue at ${body.locationName}. Est. wait: ${body.estimatedWaitMinutes} min. Fee: LKR ${fareEstimate}`,
        type: 'errand_queue_pick',
        data: { ...body, jobRef, fareEstimate, status: 'pending' },
      },
    });

    res.status(201).json({ success: true, data: { jobRef, fareEstimate, status: 'pending' } });
  } catch (err) { next(err); }
});

/** POST /errands/shifting — house shifting / man-with-van */
errandsRouter.post('/shifting', async (req, res, next) => {
  try {
    const body = z.object({
      pickupAddress: z.string().min(5),
      dropoffAddress: z.string().min(5),
      pickupFloor: z.number().int().default(0),
      dropoffFloor: z.number().int().default(0),
      inventoryItems: z.array(z.string()).default([]),
      preferredDate: z.string().datetime().optional(),
      notes: z.string().optional(),
    }).parse(req.body);

    const fareEstimate = Math.round(2500 + body.inventoryItems.length * 200 + (body.pickupFloor + body.dropoffFloor) * 150);
    const jobRef = `SHF${Date.now().toString().slice(-8)}`;

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Shifting Job Created',
        body: `From: ${body.pickupAddress} → ${body.dropoffAddress}. Est. fee: LKR ${fareEstimate}`,
        type: 'errand_shifting',
        data: { ...body, jobRef, fareEstimate, status: 'pending' },
      },
    });

    res.status(201).json({ success: true, data: { jobRef, fareEstimate, status: 'pending' } });
  } catch (err) { next(err); }
});

export { errandsRouter };
