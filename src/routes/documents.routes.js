import { Router } from 'express'
import {
  createDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  updateDocument,
} from '../controllers/documents.controllers.js'
import { validate } from '../middlewares/validate.middleware.js'
import { documentCreateSchema, documentUpdateSchema } from '../schemas/documents.schema.js'

const router = Router()

router.post('/documents', validate(documentCreateSchema), createDocument)
router.get('/documents', getDocuments)
router.get('/documents/:id', getDocumentById)
router.put('/documents/:id', validate(documentUpdateSchema), updateDocument)
router.delete('/documents/:id', deleteDocument)

export default router
