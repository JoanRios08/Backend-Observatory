import * as documentsModel from '../models/documents.models.js'

export const createDocument = async (req, res) => {
  const body = req.body || {}
  const { title, description, type, published_at, file_url, author_id, project_id, location_id } = body
  if (!title || !type || !file_url || !author_id) {
    return res.status(400).json({ ok: false, error: 'Faltan campos requeridos' })
  }

  try {
    const document = await documentsModel.createDocument({ title, description, type, published_at, file_url, author_id, project_id, location_id })
    return res.status(201).json({ ok: true, document })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al crear el documento' })
  }
}

export const getDocuments = async (req, res) => {
  try {
    const documents = await documentsModel.getAllDocuments()
    return res.status(200).json({ ok: true, documents })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener documentos' })
  }
}

export const getDocumentById = async (req, res) => {
  const { id } = req.params
  try {
    const document = await documentsModel.getDocumentById(id)
    if (!document) return res.status(404).json({ ok: false, error: 'Documento no encontrado' })
    return res.status(200).json({ ok: true, document })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener el documento' })
  }
}

export const deleteDocument = async (req, res) => {
  const { id } = req.params
  try {
    const document = await documentsModel.deleteDocument(id)
    if (!document) return res.status(404).json({ ok: false, error: 'Documento no encontrado' })
    return res.status(200).json({ ok: true, message: 'Documento eliminado', document })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al eliminar el documento' })
  }
}
