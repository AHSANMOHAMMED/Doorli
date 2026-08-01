import { Response } from 'express';
import { PrismaClient } from '@doorli/db';
import type { AuthRequest } from './types.js';

const prisma = new PrismaClient();

function extractParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

// ─── Government Services ───────────────────────────────────────────────────

export const getServices = async (_req: AuthRequest, res: Response) => {
  try {
    const services = await prisma.governmentService.findMany({
      where: { isActive: true },
    });
    res.json(services);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── License Management ────────────────────────────────────────────────────

export const createLicense = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.body;
    const userId = req.user!.userId;

    if (!serviceId) {
      res.status(400).json({ error: 'serviceId is required' });
      return;
    }

    const licenseNo = `LIC-${Date.now()}`;

    const license = await prisma.license.create({
      data: {
        userId,
        serviceId,
        licenseNo,
        status: 'pending',
      },
      include: { service: true },
    });

    res.status(201).json(license);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const listLicenses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status } = req.query;

    const where: any = { userId };
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const licenses = await prisma.license.findMany({
      where,
      include: { service: true },
      orderBy: { issuedAt: 'desc' },
    });

    res.json(licenses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getLicense = async (req: AuthRequest, res: Response) => {
  try {
    const id = extractParam(req.params.id);
    const userId = req.user!.userId;

    const license = await prisma.license.findFirst({
      where: { id, userId },
      include: { service: true },
    });

    if (!license) {
      res.status(404).json({ error: 'License not found' });
      return;
    }

    res.json(license);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLicense = async (req: AuthRequest, res: Response) => {
  try {
    const id = extractParam(req.params.id);
    const { status, expiresAt } = req.body;

    const validStatuses = ['pending', 'active', 'expired', 'suspended'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) {
      res.status(404).json({ error: 'License not found' });
      return;
    }

    const updated = await prisma.license.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      },
      include: { service: true },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Complaint Resolution ──────────────────────────────────────────────────

export const fileComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, serviceId } = req.body;
    const userId = req.user!.userId;

    if (!title || !description || !category) {
      res.status(400).json({ error: 'title, description, and category are required' });
      return;
    }

    const complaint = await prisma.complaint.create({
      data: {
        userId,
        title,
        description,
        category,
        serviceId,
      },
    });

    res.status(201).json(complaint);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const listComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status } = req.query;

    const where: any = { userId };
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(complaints);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const id = extractParam(req.params.id);
    const userId = req.user!.userId;

    const complaint = await prisma.complaint.findFirst({
      where: { id, userId },
      include: { service: true },
    });

    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    res.json(complaint);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const id = extractParam(req.params.id);
    const { status } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: { ...(status && { status }) },
      include: { service: true },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Public Consultations ──────────────────────────────────────────────────

export const createConsultation = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    if (!title || !description || !startDate || !endDate) {
      res.status(400).json({ error: 'title, description, startDate, and endDate are required' });
      return;
    }

    const consultation = await prisma.publicConsultation.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.status(201).json(consultation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const listConsultations = async (_req: AuthRequest, res: Response) => {
  try {
    const consultations = await prisma.publicConsultation.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(consultations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getConsultation = async (req: AuthRequest, res: Response) => {
  try {
    const id = extractParam(req.params.id);

    const consultation = await prisma.publicConsultation.findUnique({
      where: { id },
      include: {
        comments: {
          include: { user: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!consultation) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }

    res.json(consultation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const addConsultationComment = async (req: AuthRequest, res: Response) => {
  try {
    const id = extractParam(req.params.id);
    const { content } = req.body;
    const userId = req.user!.userId;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const consultation = await prisma.publicConsultation.findUnique({ where: { id } });
    if (!consultation) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }

    if (consultation.status !== 'open') {
      res.status(400).json({ error: 'Consultation is closed' });
      return;
    }

    const comment = await prisma.consultationComment.create({
      data: {
        consultationId: id,
        userId,
        content,
      },
      include: { user: { select: { id: true, fullName: true } } },
    });

    res.status(201).json(comment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Permits & Documents ───────────────────────────────────────────────────

export const applyForPermit = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.body;
    const userId = req.user!.userId;

    const permitNo = `PRM-${Date.now()}`;

    const permit = await prisma.permit.create({
      data: {
        userId,
        serviceId,
        permitNo,
        status: 'pending',
      },
    });

    res.status(201).json(permit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const submitTaxPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, amount, taxPeriod } = req.body;
    const userId = req.user!.userId;

    const payment = await prisma.taxPayment.create({
      data: {
        userId,
        serviceId,
        amount,
        taxPeriod,
        status: 'completed',
      },
    });

    res.status(201).json(payment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const docs = await prisma.documentVault.findMany({
      where: { userId },
    });

    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
