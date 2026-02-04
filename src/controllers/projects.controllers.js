import * as projectsModel from '../models/projects.models.js'

export const createProject = async (req, res) => {
  const body = req.body || {}
  const { name, description, start_date, end_date, status, author_id } = body
  if (!name || !author_id) {
    return res.status(400).json({ ok: false, error: 'Faltan campos requeridos' })
  }

  try {
    const project = await projectsModel.createProject({ name, description, start_date, end_date, status, author_id })
    return res.status(201).json({ ok: true, project })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al crear el proyecto' })
  }
}

export const getProjects = async (req, res) => {
  try {
    const projects = await projectsModel.getAllProjects()
    return res.status(200).json({ ok: true, projects })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener proyectos' })
  }
}

export const getProjectById = async (req, res) => {
  const { id } = req.params
  try {
    const project = await projectsModel.getProjectById(id)
    if (!project) return res.status(404).json({ ok: false, error: 'Proyecto no encontrado' })
    return res.status(200).json({ ok: true, project })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener el proyecto' })
  }
}

export const updateProject = async (req, res) => {
  const { id } = req.params
  const body = req.body || {}
  try {
    const project = await projectsModel.updateProject(id, body)
    if (!project) return res.status(404).json({ ok: false, error: 'Proyecto no encontrado' })
    return res.status(200).json({ ok: true, project })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al actualizar el proyecto' })
  }
}

export const deleteProject = async (req, res) => {
  const { id } = req.params
  try {
    const project = await projectsModel.deleteProject(id)
    if (!project) return res.status(404).json({ ok: false, error: 'Proyecto no encontrado' })
    return res.status(200).json({ ok: true, message: 'Proyecto eliminado', project })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al eliminar el proyecto' })
  }
}
