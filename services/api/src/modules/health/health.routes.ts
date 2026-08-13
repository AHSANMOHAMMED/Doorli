import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const healthRouter = Router();

// ── Seed provider data (replace with DB records in production) ──────────────
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

/** GET /health/providers/search?specialty=&type=&lat=&lng= */
healthRouter.get('/providers/search', async (req, res, next) => {
  try {
    const { specialty, type, q } = req.query as Record<string, string>;
    const results = PROVIDERS.filter(p =>
      (!type || p.type === type) &&
      (!specialty || p.specialty.toLowerCase().includes(specialty.toLowerCase())) &&
      (!q || p.name.toLowerCase().includes(q.toLowerCase()))
    );
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

/** GET /health/providers/:id — provider detail */
healthRouter.get('/providers/:id', async (req, res, next) => {
  try {
    const provider = PROVIDERS.find(p => p.id === req.params.id);
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

    const notification = await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Appointment Confirmed',
        body: `${provider.name} on ${new Date(slotTime).toLocaleString()}. ${notes || ''}`,
        type: 'appointment',
        data: { providerId, slotTime, providerName: provider.name, fee: provider.fee, notes, appointmentType: type },
      },
    });

    res.status(201).json({ success: true, data: { id: notification.id, provider: provider.name, slotTime, fee: provider.fee } });
  } catch (err) { next(err); }
});

/** GET /health/appointments/my — user's appointments */
healthRouter.get('/appointments/my', authenticateToken, async (req, res, next) => {
  try {
    const appts = await prisma.notification.findMany({
      where: { userId: req.user!.id, type: 'appointment' },
      orderBy: { sentAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: appts.map(n => ({ id: n.id, ...((n.data as Record<string, unknown>) ?? {}), title: n.title })) });
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
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Lab Collection Booked',
        body: `${lab.name} will collect on ${collectionDate} at ${collectionTime}. Ref: ${ref}`,
        type: 'lab_order',
        data: { labId, tests, collectionDate, collectionTime, address, ref },
      },
    });

    res.status(201).json({ success: true, data: { ref, lab: lab.name, tests, collectionDate, collectionTime } });
  } catch (err) { next(err); }
});

/** POST /health/medicine-orders — order medicines (Rx validation) */
healthRouter.post('/medicine-orders', authenticateToken, async (req, res, next) => {
  try {
    const { pharmacyId, items, prescriptionUrl } = z.object({
      pharmacyId: z.string(),
      items: z.array(z.object({ name: z.string(), qty: z.number().int().positive(), isRx: z.boolean().default(false) })),
      prescriptionUrl: z.string().url().optional(),
    }).parse(req.body);

    const rxItems = items.filter(i => i.isRx);
    if (rxItems.length > 0 && !prescriptionUrl)
      throw new AppError(400, 'PRESCRIPTION_REQUIRED: Please upload a valid prescription for Rx medicines');

    const ref = `MED${Date.now().toString().slice(-8)}`;
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Medicine Order Placed',
        body: `${items.length} item(s) ordered. Ref: ${ref}`,
        type: 'medicine_order',
        data: { pharmacyId, items, prescriptionUrl, ref },
      },
    });

    res.status(201).json({ success: true, data: { ref, items, hasRxItems: rxItems.length > 0 } });
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
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Nurse Visit Confirmed',
        body: `Nurse assigned for ${new Date(visitDate).toLocaleString()} (${durationHours}h). Ref: ${ref}`,
        type: 'nursing_booking',
        data: { visitDate, durationHours, requirements, address, ref },
      },
    });

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
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Class Booked',
        body: `${className} at ${provider.name} on ${new Date(classDate).toLocaleString()}. Ref: ${ref}`,
        type: 'class_booking',
        data: { providerId, classDate, className, ref, fee: provider.fee, maxParticipants },
      },
    });

    res.status(201).json({ success: true, data: { ref, className, provider: provider.name, classDate, fee: provider.fee } });
  } catch (err) { next(err); }
});

export default healthRouter;
