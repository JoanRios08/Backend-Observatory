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
import { userCreateSchema, userUpdateSchema, loginSchema } from '../schemas/users.schema.js'

const router = Router();

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', validate(userCreateSchema), createUser);
router.post('/login', validate(loginSchema), login);
router.put('/users/:id', validate(userUpdateSchema), updateUser);
router.delete('/users/:id', deleteUser);

export default router;