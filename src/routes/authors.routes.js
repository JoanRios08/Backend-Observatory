import { Router } from 'express'
import {
  createAuthor,
  getAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
} from '../controllers/authors.controllers.js'
import { validate } from '../middlewares/validate.middleware.js'
import { authorCreateSchema, authorUpdateSchema } from '../schemas/authors.schema.js'

const router = Router()

router.post('/authors', validate(authorCreateSchema), createAuthor)
router.get('/authors', getAuthors)
router.get('/authors/:id', getAuthorById)
router.put('/authors/:id', validate(authorUpdateSchema), updateAuthor)
router.delete('/authors/:id', deleteAuthor)

export default router
