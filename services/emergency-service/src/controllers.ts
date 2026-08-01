import { Request, Response } from 'express';
import { PrismaClient } from '@doorli/db';

const prisma = new PrismaClient();

export const getIncidents = async (_req: Request, res: Response) => {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { reporter: { select: { id: true, fullName: true } } },
    });
    res.json({ data: incidents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const reportIncident = async (req: Request, res: Response) => {
  try {
    const { reporterId, type, description, latitude, longitude, isAnonymous } = req.body;
    const incident = await prisma.incident.create({
      data: {
        reporterId,
        type,
        description,
        latitude,
        longitude,
        isAnonymous,
      },
    });
    res.status(201).json({ data: incident });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAlerts = async (_req: Request, res: Response) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: alerts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateIncidentStatus = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    const validStatuses = ['open', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: { status },
    });

    res.json({ data: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createAlert = async (req: Request, res: Response) => {
  try {
    const { senderId, type, priority, message, expiresAt } = req.body;

    const alert = await prisma.alert.create({
      data: {
        senderId,
        type,
        priority,
        message,
        status: 'active',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Broadcast new alert to connected clients
    const io = (req as any).io;
    if (io) {
      io.emit('emergency:alert:new', alert);
    }

    res.status(201).json({ data: alert });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAlert = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    const validStatuses = ['active', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { status },
    });

    // Broadcast alert update
    const io = (req as any).io;
    if (io) {
      io.emit('emergency:alert:update', updated);
    }

    res.json({ data: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const triggerSOS = async (req: Request, res: Response) => {
  try {
    const { userId, latitude, longitude } = req.body;
    const sosRecord = await prisma.sOSRecord.create({
      data: {
        userId,
        latitude,
        longitude,
        status: 'active',
      },
    });

    // Broadcast SOS to all connected admin/emergency responder sockets
    const io = (req as any).io;
    if (io) {
      io.to('admin:sos').emit('emergency:sos', {
        id: sosRecord.id,
        userId: sosRecord.userId,
        latitude: sosRecord.latitude,
        longitude: sosRecord.longitude,
        status: sosRecord.status,
        createdAt: sosRecord.createdAt,
      });
    }

    res.status(201).json({ data: sosRecord });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
