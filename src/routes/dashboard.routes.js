import { Router } from 'express';
import * as dashboardCtrl from '../controllers/dashboard.controllers.js';
import { validate } from '../middlewares/validate.middleware.js'; // <--- ESTA LÍNEA ES LA CLAVE
import { documentCreateSchema } from '../schemas/documents.schema.js';

const router = Router();

// Dashboard Summary
router.get('/dashboard/summary', dashboardCtrl.getDashboardData);

// Documents CRUD
router.get('/documents', dashboardCtrl.getDocuments);
router.get('/documents/:id', dashboardCtrl.getDocumentById);
router.post('/documents', validate(documentCreateSchema), dashboardCtrl.createDocument);
router.delete('/documents/:id', dashboardCtrl.deleteDocument);

export default router;