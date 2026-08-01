import { Router } from 'express';
import { authenticateToken, requireAdmin } from './middleware/auth.js';
import {
  getServices,
  createLicense,
  listLicenses,
  getLicense,
  updateLicense,
  fileComplaint,
  listComplaints,
  getComplaint,
  updateComplaint,
  createConsultation,
  listConsultations,
  getConsultation,
  addConsultationComment,
  applyForPermit,
  submitTaxPayment,
  getMyDocuments,
} from './controllers.js';

export const govRoutes = Router();

// Public routes
govRoutes.get('/services', getServices);

// All routes below require authentication
govRoutes.use(authenticateToken);

// ─── License Management ────────────────────────────────────────────────────
govRoutes.post('/licenses', createLicense);
govRoutes.get('/licenses', listLicenses);
govRoutes.get('/licenses/:id', getLicense);
govRoutes.patch('/licenses/:id', requireAdmin, updateLicense);

// ─── Complaint Resolution ──────────────────────────────────────────────────
govRoutes.post('/complaints', fileComplaint);
govRoutes.get('/complaints', listComplaints);
govRoutes.get('/complaints/:id', getComplaint);
govRoutes.patch('/complaints/:id', requireAdmin, updateComplaint);

// ─── Public Consultations ──────────────────────────────────────────────────
govRoutes.post('/consultations', requireAdmin, createConsultation);
govRoutes.get('/consultations', listConsultations);
govRoutes.get('/consultations/:id', getConsultation);
govRoutes.post('/consultations/:id/comments', addConsultationComment);

// ─── Permits & Taxes ───────────────────────────────────────────────────────
govRoutes.post('/permits', applyForPermit);
govRoutes.post('/taxes', submitTaxPayment);

// ─── Documents ─────────────────────────────────────────────────────────────
govRoutes.get('/documents', getMyDocuments);
