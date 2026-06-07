import { Router } from 'express';
import {
  createCampusCareerCatalog,
  createCampusCatalog,
  createCareerCatalog,
  deleteCampusCareerCatalog,
  deleteCampusCatalog,
  deleteCareerCatalog,
  getAcademicCatalogs,
  getCampus,
  getCampusCareerCatalog,
  getCampusCareer,
  getCampusCatalog,
  getCareer,
  getCareerCatalog,
  updateCampusCareerCatalog,
  updateCampusCatalog,
  updateCareerCatalog,
} from '../controllers/academic.controllers.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  campusCareerCreateSchema,
  campusCareerUpdateSchema,
  campusCreateSchema,
  campusUpdateSchema,
  careerCreateSchema,
  careerUpdateSchema,
} from '../schemas/academic.schema.js';

const router = Router();

router.get('/academic-options', getAcademicCatalogs);
router.get('/campuses', getCampusCatalog);
router.post('/campuses', validate(campusCreateSchema), createCampusCatalog);
router.get('/campuses/:id', getCampus);
router.put('/campuses/:id', validate(campusUpdateSchema), updateCampusCatalog);
router.patch('/campuses/:id', validate(campusUpdateSchema), updateCampusCatalog);
router.delete('/campuses/:id', deleteCampusCatalog);

router.get('/careers', getCareerCatalog);
router.post('/careers', validate(careerCreateSchema), createCareerCatalog);
router.get('/careers/:id', getCareer);
router.put('/careers/:id', validate(careerUpdateSchema), updateCareerCatalog);
router.patch('/careers/:id', validate(careerUpdateSchema), updateCareerCatalog);
router.delete('/careers/:id', deleteCareerCatalog);

router.get('/campus-careers', getCampusCareerCatalog);
router.post('/campus-careers', validate(campusCareerCreateSchema), createCampusCareerCatalog);
router.get('/campus-careers/:id', getCampusCareer);
router.put('/campus-careers/:id', validate(campusCareerUpdateSchema), updateCampusCareerCatalog);
router.patch('/campus-careers/:id', validate(campusCareerUpdateSchema), updateCampusCareerCatalog);
router.delete('/campus-careers/:id', deleteCampusCareerCatalog);

router.get('/campus_careers', getCampusCareerCatalog);
router.post('/campus_careers', validate(campusCareerCreateSchema), createCampusCareerCatalog);
router.get('/campus_careers/:id', getCampusCareer);
router.put('/campus_careers/:id', validate(campusCareerUpdateSchema), updateCampusCareerCatalog);
router.patch('/campus_careers/:id', validate(campusCareerUpdateSchema), updateCampusCareerCatalog);
router.delete('/campus_careers/:id', deleteCampusCareerCatalog);

export default router;
