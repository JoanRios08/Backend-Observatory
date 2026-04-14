import { Router } from 'express';
import * as dashboardCtrl from '../controllers/dashboard.controllers.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { documentCreateSchema } from '../schemas/documents.schema.js';

const router = Router();

// Dashboard Summary
router.get('/dashboard/summary', authenticate, dashboardCtrl.getDashboardData);

// Dashboard Documents CRUD (evita colisión con /documents de documents.routes.js)
router.get('/dashboard/documents', authenticate, dashboardCtrl.getDocuments);
router.get('/dashboard/documents/:id', authenticate, dashboardCtrl.getDocumentById);
router.post('/dashboard/documents', authenticate, validate(documentCreateSchema), dashboardCtrl.createDocument);
router.delete('/dashboard/documents/:id', authenticate, dashboardCtrl.deleteDocument);

export default router;
