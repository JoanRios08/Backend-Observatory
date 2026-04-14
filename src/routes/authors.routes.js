import { Router } from 'express'
import {
  createAuthor,
  getAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
} from '../controllers/authors.controllers.js'
import { validate } from '../middlewares/validate.middleware.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorCreateSchema, authorUpdateSchema } from '../schemas/authors.schema.js'

const router = Router()

router.post('/authors', authenticate, validate(authorCreateSchema), createAuthor)
router.get('/authors', getAuthors)
router.get('/authors/:id', getAuthorById)
router.put('/authors/:id', authenticate, validate(authorUpdateSchema), updateAuthor)
router.delete('/authors/:id', authenticate, deleteAuthor)

export default router
