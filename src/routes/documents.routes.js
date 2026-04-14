import { Router } from 'express'
import {
  createDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  updateDocument,
} from '../controllers/documents.controllers.js'
import { validate } from '../middlewares/validate.middleware.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { documentCreateSchema, documentUpdateSchema } from '../schemas/documents.schema.js'

const router = Router()

router.post('/documents', authenticate, validate(documentCreateSchema), createDocument)
router.get('/documents', getDocuments)
router.get('/documents/:id', getDocumentById)
router.put('/documents/:id', authenticate, validate(documentUpdateSchema), updateDocument)
router.delete('/documents/:id', authenticate, deleteDocument)

export default router
