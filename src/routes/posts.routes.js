import { Router } from 'express'
import {
  createPost,
  getPosts,
  getPostById,
  deletePost,
} from '../controllers/posts.controllers.js'
import { validate } from '../middlewares/validate.middleware.js'
import { postCreateSchema, postUpdateSchema } from '../schemas/posts.schema.js'

const router = Router()

router.post('/posts', validate(postCreateSchema), createPost)
router.get('/posts', getPosts)
router.get('/posts/:id', getPostById)
router.delete('/posts/:id', deletePost)

export default router
