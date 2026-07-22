import { Router } from 'express';
import { getIncidents, reportIncident, getAlerts, triggerSOS } from './controllers.js';

const router = Router();

// Incidents
router.get('/incidents', getIncidents);
router.post('/incidents', reportIncident);

// Alerts
router.get('/alerts', getAlerts);

// SOS
router.post('/sos', triggerSOS);

export default router;
