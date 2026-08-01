import { Router } from 'express';
import {
  getIncidents,
  reportIncident,
  getAlerts,
  triggerSOS,
  updateIncidentStatus,
  createAlert,
  updateAlert,
} from './controllers.js';

const router = Router();

// Incidents
router.get('/incidents', getIncidents);
router.post('/incidents', reportIncident);
router.patch('/incidents/:id', updateIncidentStatus);

// Alerts
router.get('/alerts', getAlerts);
router.post('/alerts', createAlert);
router.patch('/alerts/:id', updateAlert);

// SOS
router.post('/sos', triggerSOS);

export default router;
