import { Router } from 'express'
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projects.controllers.js'
import { validate } from '../middlewares/validate.middleware.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { projectCreateSchema, projectUpdateSchema } from '../schemas/projects.schema.js'

const router = Router()

router.post('/projects', authenticate, validate(projectCreateSchema), createProject)
router.get('/projects', getProjects)
router.get('/projects/:id', getProjectById)
router.put('/projects/:id', authenticate, validate(projectUpdateSchema), updateProject)
router.delete('/projects/:id', authenticate, deleteProject)

export default router
