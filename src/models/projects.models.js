import { pool } from '../db.js'

export const createProject = async ({ name, description, start_date, end_date, status, author_id }) => {
  const query = `INSERT INTO public."Project" ("name","description","start_date","end_date","status","author_id") VALUES ($1,$2,$3,$4,COALESCE($5, 'active'),$6) RETURNING *`;
  const values = [name, description, start_date, end_date, status, author_id]
  const result = await pool.query(query, values)
  return result.rows[0]
}

export const getAllProjects = async () => {
  const result = await pool.query('SELECT p.*, a.name AS author_name FROM public."Project" p LEFT JOIN public."Author" a ON p.author_id = a.id ORDER BY p.created_at DESC')
  return result.rows
}

export const getProjectById = async (id) => {
  const result = await pool.query('SELECT p.*, a.name AS author_name FROM public."Project" p LEFT JOIN public."Author" a ON p.author_id = a.id WHERE p.id = $1', [id])
  return result.rows[0] || null
}

export const updateProject = async (id, body) => {
  const keys = Object.keys(body)
  if (keys.length === 0) return null

  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
  const values = keys.map(k => body[k])
  values.push(id)

  const query = `UPDATE public."Project" SET ${setClause} WHERE id = $${values.length} RETURNING *`
  const result = await pool.query(query, values)
  return result.rows[0] || null
}

export const deleteProject = async (id) => {
  const result = await pool.query('DELETE FROM public."Project" WHERE id = $1 RETURNING *', [id])
  return result.rows[0] || null
}
