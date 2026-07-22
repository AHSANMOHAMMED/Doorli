import { Router } from 'express';
import {
  getServices,
  applyForPermit,
  submitTaxPayment,
  fileComplaint,
  getMyDocuments
} from './controllers';

export const govRoutes = Router();

govRoutes.get('/services', getServices);
govRoutes.post('/permits', applyForPermit);
govRoutes.post('/taxes', submitTaxPayment);
govRoutes.post('/complaints', fileComplaint);
govRoutes.get('/documents/:userId', getMyDocuments);
