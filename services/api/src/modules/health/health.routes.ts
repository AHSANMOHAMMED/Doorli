import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const healthRouter = Router();

// Provider catalog is bootstrapped into the domain table on first use.
const PROVIDERS = [
  { id: 'doc1', name: 'Dr. Amara Silva', type: 'doctor', specialty: 'General Practitioner', city: 'Colombo', lat: 6.927, lng: 79.861, fee: 1500 },
  { id: 'doc2', name: 'Dr. Priya Mendis', type: 'doctor', specialty: 'Pediatrician', city: 'Colombo', lat: 6.910, lng: 79.848, fee: 2000 },
  { id: 'lab1', name: 'Nawaloka Lab', type: 'lab', specialty: 'Full Blood Count, Lipid Panel', city: 'Colombo', lat: 6.915, lng: 79.855, fee: 800 },
  { id: 'lab2', name: 'Lanka Hospitals Lab', type: 'lab', specialty: 'PCR, Thyroid', city: 'Colombo', lat: 6.903, lng: 79.862, fee: 1200 },
  { id: 'gym1', name: 'Fitness First', type: 'gym', specialty: 'Weight Training, Cardio', city: 'Colombo', lat: 6.920, lng: 79.858, fee: 500 },
  { id: 'yoga1', name: 'Zen Yoga Studio', type: 'yoga', specialty: 'Hatha, Vinyasa', city: 'Colombo', lat: 6.925, lng: 79.852, fee: 800 },
  { id: 'nurse1', name: 'CareHome Nurses', type: 'nurse', specialty: 'Post-op, Elderly Care', city: 'Colombo', lat: 6.918, lng: 79.860, fee: 2500 },
  { id: 'pharm1', name: 'Osu Sala Pharmacy', type: 'pharmacy', specialty: 'General Medicines', city: 'Colombo', lat: 6.922, lng: 79.857, fee: 0 },
];

async function ensureProviders() {
  await Promise.all(PROVIDERS.map((provider) => prisma.healthProvider.upsert({
    where: { id: provider.id },
    update: { name: provider.name, type: provider.type, specialty: provider.specialty, city: provider.city, latitude: provider.lat, longitude: provider.lng, fee: provider.fee, isActive: true },
    create: { id: provider.id, name: provider.name, type: provider.type, specialty: provider.specialty, city: provider.city, latitude: provider.lat, longitude: provider.lng, fee: provider.fee },
  })));
}

function idempotencyKey(req: { headers: Record<string, unknown> }) {
  const value = req.headers['idempotency-key'];
  if (typeof value !== 'string' || !value.trim()) throw new AppError(400, 'A valid Idempotency-Key header is required');
  return value;
}

/** GET /health/providers/search?specialty=&type=&lat=&lng= */
healthRouter.get('/providers/search', async (req, res, next) => {
  try {
    await ensureProviders();
    const { specialty, type, q } = req.query as Record<string, string>;
    const results = await prisma.healthProvider.findMany({ where: { isActive: true, ...(type ? { type } : {}), ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}), ...(specialty ? { specialty: { contains: specialty, mode: 'insensitive' } } : {}) } });
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

/** GET /health/providers/:id — provider detail */
healthRouter.get('/providers/:id', async (req, res, next) => {
  try {
    await ensureProviders();
    const provider = await prisma.healthProvider.findUnique({ where: { id: req.params.id } });
    if (!provider) throw new AppError(404, 'Provider not found');
    // Generate 30-min slots for today and next 7 days
    const slots: string[] = [];
    for (let h = 9; h < 18; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    res.json({ success: true, data: { ...provider, slots } });
  } catch (err) { next(err); }
});

/** POST /health/appointments — book doctor/clinic slot */
healthRouter.post('/appointments', authenticateToken, async (req, res, next) => {
  try {
    const { providerId, slotTime, notes, type } = z.object({
      providerId: z.string(),
      slotTime: z.string().datetime(),
      notes: z.string().optional(),
      type: z.enum(['doctor', 'lab', 'gym', 'yoga', 'nurse']).default('doctor'),
    }).parse(req.body);

    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) throw new AppError(404, 'Provider not found');

    const appointment = await prisma.appointment.create({ data: { userId: req.user!.id, providerId, slotTime: new Date(slotTime), notes, type } });

    res.status(201).json({ success: true, data: { id: appointment.id, provider: provider.name, slotTime, fee: Number(provider.fee) } });
  } catch (err) { next(err); }
});

/** GET /health/appointments/my — user's appointments */
healthRouter.get('/appointments/my', authenticateToken, async (req, res, next) => {
  try {
    const appts = await prisma.appointment.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: appts });
  } catch (err) { next(err); }
});

/** POST /health/lab-orders — home collection booking */
healthRouter.post('/lab-orders', authenticateToken, async (req, res, next) => {
  try {
    const { labId, tests, collectionDate, collectionTime, address } = z.object({
      labId: z.string(),
      tests: z.array(z.string()).min(1),
      collectionDate: z.string(),
      collectionTime: z.string(),
      address: z.string().min(5),
    }).parse(req.body);

    const lab = PROVIDERS.find(p => p.id === labId && p.type === 'lab');
    if (!lab) throw new AppError(404, 'Lab not found');

    const ref = `LAB${Date.now().toString().slice(-8)}`;
    await prisma.labOrder.create({ data: { userId: req.user!.id, providerId: labId, tests, collectionSlot: new Date(`${collectionDate}T${collectionTime}`), address, reference: ref } });

    res.status(201).json({ success: true, data: { ref, lab: lab.name, tests, collectionDate, collectionTime } });
  } catch (err) { next(err); }
});

/** POST /health/medicine-orders — order medicines (Rx validation) */
healthRouter.post('/prescriptions', authenticateToken, async (req, res, next) => {
  try {
    const { fileUrl, notes } = z.object({ fileUrl: z.string().url(), notes: z.string().max(500).optional() }).parse(req.body);
    const prescription = await prisma.prescription.create({ data: { userId: req.user!.id, fileUrl, notes } });
    res.status(201).json({ success: true, data: prescription });
  } catch (err) { next(err); }
});

healthRouter.get('/prescriptions/my', authenticateToken, async (req, res, next) => {
  try {
    const prescriptions = await prisma.prescription.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: prescriptions });
  } catch (err) { next(err); }
});

healthRouter.get('/medicine-orders/my', authenticateToken, async (req, res, next) => {
  try {
    const orders = await prisma.medicineOrder.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

healthRouter.post('/medicine-orders', authenticateToken, async (req, res, next) => {
  try {
    const { pharmacyId, items, prescriptionUrl, prescriptionId } = z.object({
      pharmacyId: z.string(),
      items: z.array(z.object({ name: z.string(), qty: z.number().int().positive(), isRx: z.boolean().default(false) })),
      prescriptionUrl: z.string().url().optional(),
      prescriptionId: z.string().uuid().optional(),
    }).parse(req.body);

    const rxItems = items.filter(i => i.isRx);
    if (!PROVIDERS.some(p => p.id === pharmacyId && p.type === 'pharmacy')) throw new AppError(404, 'Pharmacy not found');
    if (rxItems.length > 0 && !prescriptionUrl && !prescriptionId)
      throw new AppError(400, 'PRESCRIPTION_REQUIRED: Please upload a valid prescription for Rx medicines');

    const key = idempotencyKey(req);
    const existing = await prisma.medicineOrder.findUnique({ where: { userId_idempotencyKey: { userId: req.user!.id, idempotencyKey: key } } });
    if (existing) return res.json({ success: true, data: { ...existing, replayed: true } });
    if (prescriptionId) {
      const prescription = await prisma.prescription.findFirst({ where: { id: prescriptionId, userId: req.user!.id } });
      if (!prescription) throw new AppError(404, 'Prescription not found');
    }

    const ref = `MED${Date.now().toString().slice(-8)}`;
    const order = await prisma.medicineOrder.create({ data: { userId: req.user!.id, pharmacyId, items, prescriptionUrl, prescriptionId, idempotencyKey: key, reference: ref, status: 'pending_review' } });

    res.status(201).json({ success: true, data: { ...order, ref, items, hasRxItems: rxItems.length > 0, fulfillment: 'pending_pharmacy_review', replayed: false } });
  } catch (err) { next(err); }
});

const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending_review: ['approved', 'rejected'],
  approved: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  rejected: [],
  cancelled: [],
};

healthRouter.get('/medicine-orders', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const orders = await prisma.medicineOrder.findMany({ where: status ? { status } : undefined, orderBy: { createdAt: 'asc' }, take: 100 });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

healthRouter.patch('/medicine-orders/:id/status', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['approved', 'rejected', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']) }).parse(req.body);
    const orderId = String(req.params.id);
    const order = await prisma.medicineOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError(404, 'Medicine order not found');
    if (!ORDER_TRANSITIONS[order.status]?.includes(status)) throw new AppError(409, `Cannot move order from ${order.status} to ${status}`);
    const updated = await prisma.medicineOrder.update({ where: { id: order.id }, data: { status } });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

healthRouter.patch('/prescriptions/:id/status', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['approved', 'rejected']) }).parse(req.body);
    const prescriptionId = String(req.params.id);
    const prescription = await prisma.prescription.updateMany({ where: { id: prescriptionId, status: 'pending_review' }, data: { status } });
    if (!prescription.count) throw new AppError(404, 'Pending prescription not found');
    res.json({ success: true, data: { id: prescriptionId, status } });
  } catch (err) { next(err); }
});

/** POST /health/nursing-bookings — home nursing visit */
healthRouter.post('/nursing-bookings', authenticateToken, async (req, res, next) => {
  try {
    const { visitDate, durationHours, requirements, address } = z.object({
      visitDate: z.string().datetime(),
      durationHours: z.number().int().min(2).max(24),
      requirements: z.string().optional(),
      address: z.string().min(5),
    }).parse(req.body);

    const ref = `NRS${Date.now().toString().slice(-8)}`;
    await prisma.nursingBooking.create({ data: { userId: req.user!.id, visitDate: new Date(visitDate), durationHours, requirements, address, reference: ref } });

    res.status(201).json({ success: true, data: { ref, visitDate, durationHours, estimatedFee: durationHours * 2500 } });
  } catch (err) { next(err); }
});

/** POST /health/class-bookings — gym/yoga class */
healthRouter.post('/class-bookings', authenticateToken, async (req, res, next) => {
  try {
    const { providerId, classDate, className, maxParticipants = 20 } = z.object({
      providerId: z.string(),
      classDate: z.string().datetime(),
      className: z.string().min(2),
      maxParticipants: z.number().int().optional(),
    }).parse(req.body);

    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) throw new AppError(404, 'Provider not found');

    const ref = `CLS${Date.now().toString().slice(-8)}`;
    const current = await prisma.classBooking.count({ where: { providerId, classDate: new Date(classDate), status: 'confirmed' } });
    if (current >= maxParticipants) throw new AppError(409, 'Class is full');
    await prisma.classBooking.create({ data: { userId: req.user!.id, providerId, classDate: new Date(classDate), className, maxParticipants, reference: ref } });

    res.status(201).json({ success: true, data: { ref, className, provider: provider.name, classDate, fee: provider.fee } });
  } catch (err) { next(err); }
});

export default healthRouter;
