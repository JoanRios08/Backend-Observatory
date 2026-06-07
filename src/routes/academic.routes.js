import { Router } from 'express';
import { getAcademicCatalogs } from '../controllers/academic.controllers.js';

const router = Router();

router.get('/academic-options', getAcademicCatalogs);

export default router;
