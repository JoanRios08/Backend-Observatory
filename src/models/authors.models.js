import { pool } from '../db.js'

export const createAuthor = async ({ name, bio, email }) => {
  const query = `INSERT INTO public."Author" ("name","bio","email") VALUES ($1,$2,$3) RETURNING *`;
  const values = [name, bio || null, email || null]
  const result = await pool.query(query, values)
  return result.rows[0]
}

export const getAllAuthors = async () => {
  const result = await pool.query('SELECT * FROM public."Author" ORDER BY id DESC')
  return result.rows
}

export const getAuthorById = async (id) => {
  const result = await pool.query('SELECT * FROM public."Author" WHERE id = $1', [id])
  return result.rows[0] || null
}

export const updateAuthor = async (id, body) => {
  const keys = Object.keys(body)
  if (keys.length === 0) return null

  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
  const values = keys.map(k => body[k])
  values.push(id)

  const query = `UPDATE public."Author" SET ${setClause} WHERE id = $${values.length} RETURNING *`
  const result = await pool.query(query, values)
  return result.rows[0] || null
}

export const deleteAuthor = async (id) => {
  const result = await pool.query('DELETE FROM public."Author" WHERE id = $1 RETURNING *', [id])
  return result.rows[0] || null
}
