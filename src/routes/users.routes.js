import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  login,
} from '../controllers/users.controllers.js'
import { validate } from '../middlewares/validate.middleware.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { userCreateSchema, userUpdateSchema, loginSchema } from '../schemas/users.schema.js'

const router = Router();

router.get('/users', authenticate, getUsers);
router.get('/users/:id', authenticate, getUserById);
router.post('/users', validate(userCreateSchema), createUser);
router.post('/login', validate(loginSchema), login);
router.put('/users/:id', authenticate, validate(userUpdateSchema), updateUser);
router.delete('/users/:id', authenticate, deleteUser);

export default router;
