import { pool } from '../db.js'

export const createDocument = async (req, res) => {
  const body = req.body || {}
  const { title, description, type, published_at, file_url, author_id, project_id, location_id } = body
  if (!title || !type || !file_url || !author_id) {
    return res.status(400).json({ ok: false, error: 'Faltan campos requeridos' })
  }

  try {
    const query = `INSERT INTO public."Document" ("title","description","type","published_at","file_url","author_id","project_id","location_id") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
    const values = [title, description || null, type, published_at || null, file_url, author_id, project_id || null, location_id || null]
    const result = await pool.query(query, values)
    return res.status(201).json({ ok: true, document: result.rows[0] })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al crear el documento' })
  }
}

export const getDocuments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public."Document" ORDER BY created_at DESC')
    return res.status(200).json({ ok: true, documents: result.rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener documentos' })
  }
}

export const getDocumentById = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query('SELECT * FROM public."Document" WHERE id = $1', [id])
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Documento no encontrado' })
    return res.status(200).json({ ok: true, document: result.rows[0] })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener el documento' })
  }
}

export const deleteDocument = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query('DELETE FROM public."Document" WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Documento no encontrado' })
    return res.status(200).json({ ok: true, message: 'Documento eliminado', document: result.rows[0] })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al eliminar el documento' })
  }
}
