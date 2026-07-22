import { Request, Response } from 'express';
import { PrismaClient } from '@doorli/db';

const prisma = new PrismaClient();

export const getIncidents = async (req: Request, res: Response) => {
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

export const getAlerts = async (req: Request, res: Response) => {
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
    // In a real implementation, this would emit an event to Kafka or trigger WebSocket notifications
    res.status(201).json({ data: sosRecord });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
