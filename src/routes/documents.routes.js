import { Router } from 'express'
import {
  createDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} from '../controllers/documents.controllers.js'

const router = Router()

router.post('/documents', createDocument)
router.get('/documents', getDocuments)
router.get('/documents/:id', getDocumentById)
router.delete('/documents/:id', deleteDocument)

export default router
