import { pool } from '../db.js'

export const createDocument = async ({ title, description, type, published_at, file_url, author_id, project_id, location_id }) => {
  const query = `INSERT INTO public."Document" ("title","description","type","published_at","file_url","author_id","project_id","location_id") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
  const values = [title, description || null, type, published_at || null, file_url, author_id, project_id || null, location_id || null]
  const result = await pool.query(query, values)
  return result.rows[0]
}

export const getAllDocuments = async () => {
  const result = await pool.query('SELECT d.*, a.name AS author_name FROM public."Document" d LEFT JOIN public."Author" a ON d.author_id = a.id ORDER BY d.created_at DESC')
  return result.rows
}

export const getDocumentById = async (id) => {
  const result = await pool.query('SELECT d.*, a.name AS author_name FROM public."Document" d LEFT JOIN public."Author" a ON d.author_id = a.id WHERE d.id = $1', [id])
  return result.rows[0] || null
}

export const deleteDocument = async (id) => {
  const result = await pool.query('DELETE FROM public."Document" WHERE id = $1 RETURNING *', [id])
  return result.rows[0] || null
}