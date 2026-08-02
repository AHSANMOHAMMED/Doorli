import { Router, Request, Response, NextFunction } from 'express';
import {
  getIncidents,
  reportIncident,
  getAlerts,
  triggerSOS,
  updateIncidentStatus,
  createAlert,
  updateAlert,
} from './controllers.js';
import jwt from 'jsonwebtoken';

const router = Router();

// JWT Auth Middleware
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'doorli-dev-access-secret-change-in-prod') as any;
    (req as any).userId = decoded.sub || decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Incidents
router.get('/incidents', getIncidents);
router.post('/incidents', requireAuth, reportIncident);
router.patch('/incidents/:id', requireAuth, updateIncidentStatus);

// Alerts
router.get('/alerts', getAlerts);
router.post('/alerts', requireAuth, createAlert);
router.patch('/alerts/:id', requireAuth, updateAlert);

// SOS
router.post('/sos', triggerSOS);

export default router;
