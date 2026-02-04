import { Router } from 'express'
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projects.controllers.js'
import { validate } from '../middlewares/validate.middleware.js'
import { projectCreateSchema, projectUpdateSchema } from '../schemas/projects.schema.js'

const router = Router()

router.post('/projects', validate(projectCreateSchema), createProject)
router.get('/projects', getProjects)
router.get('/projects/:id', getProjectById)
router.put('/projects/:id', validate(projectUpdateSchema), updateProject)
router.delete('/projects/:id', deleteProject)

export default router
