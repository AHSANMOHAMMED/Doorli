import { Request, Response } from 'express';
import { PrismaClient } from '@doorli/db';

const prisma = new PrismaClient();

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await prisma.governmentService.findMany({
      where: { isActive: true },
    });
    res.json(services);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const applyForPermit = async (req: Request, res: Response) => {
  try {
    const { userId, serviceId } = req.body;
    
    // In a real app, generate a proper permit number based on the service
    const permitNo = `PRM-${Date.now()}`;
    
    const permit = await prisma.permit.create({
      data: {
        userId,
        serviceId,
        permitNo,
        status: 'pending',
      }
    });
    
    res.status(201).json(permit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const submitTaxPayment = async (req: Request, res: Response) => {
  try {
    const { userId, serviceId, amount, taxPeriod } = req.body;
    
    const payment = await prisma.taxPayment.create({
      data: {
        userId,
        serviceId,
        amount,
        taxPeriod,
        status: 'completed', // Simplified for demo
      }
    });
    
    res.status(201).json(payment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const fileComplaint = async (req: Request, res: Response) => {
  try {
    const { userId, title, description, category, serviceId } = req.body;
    
    const complaint = await prisma.complaint.create({
      data: {
        userId,
        title,
        description,
        category,
        serviceId, // Optional
      }
    });
    
    res.status(201).json(complaint);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyDocuments = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const docs = await prisma.documentVault.findMany({
      where: { userId },
    });
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
