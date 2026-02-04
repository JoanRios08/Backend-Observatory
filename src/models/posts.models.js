import { pool } from '../db.js'

export const createPost = async ({ title, content, status, user_id, category_id, author_id }) => {
  const query = `INSERT INTO public."Post" ("title","content","status","user_id","category_id","author_id") VALUES ($1,$2,COALESCE($3, 'pending_approval'),$4,$5,$6) RETURNING *`;
  const values = [title, content, status, user_id, category_id, author_id]
  const result = await pool.query(query, values)
  return result.rows[0]
}

export const getAllPosts = async () => {
  const result = await pool.query('SELECT * FROM public."Post" ORDER BY created_at DESC')
  return result.rows
}

export const getPostById = async (id) => {
  const result = await pool.query('SELECT * FROM public."Post" WHERE id = $1', [id])
  return result.rows[0] || null
}

export const deletePost = async (id) => {
  const result = await pool.query('DELETE FROM public."Post" WHERE id = $1 RETURNING *', [id])
  return result.rows[0] || null
}