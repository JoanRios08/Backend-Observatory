import { Router } from 'express'
import {
  createPost,
  getPosts,
  getPostById,
  deletePost,
} from '../controllers/posts.controllers.js'

const router = Router()

router.post('/posts', createPost)
router.get('/posts', getPosts)
router.get('/posts/:id', getPostById)
router.delete('/posts/:id', deletePost)

export default router
