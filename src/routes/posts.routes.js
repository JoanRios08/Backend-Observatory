import { Router } from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  deletePost,
  updatePost,
} from '../controllers/posts.controllers.js';
import { validate } from '../middlewares/validate.middleware.js';
import { postCreateSchema, postUpdateSchema } from '../schemas/posts.schema.js';

const router = Router();

router.post('/posts', validate(postCreateSchema), createPost);
router.get('/posts', getPosts);
router.get('/posts/:id', getPostById);
router.put('/posts/:id', validate(postUpdateSchema), updatePost);
router.patch('/posts/:id', validate(postUpdateSchema), updatePost);
router.delete('/posts/:id', deletePost);

export default router;
