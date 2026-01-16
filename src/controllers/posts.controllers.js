import { pool } from '../db.js'

export const createPost = async (req, res) => {
  const body = req.body || {}
  const { title, content, status, user_id, category_id, author_id } = body
  if (!title || !content || !user_id || !category_id || !author_id) {
    return res.status(400).json({ ok: false, error: 'Faltan campos requeridos' })
  }

  try {
    const query = `INSERT INTO public."Post" ("title","content","status","user_id","category_id","author_id") VALUES ($1,$2,COALESCE($3, 'pending_approval'),$4,$5,$6) RETURNING *`;
    const values = [title, content, status, user_id, category_id, author_id]
    const result = await pool.query(query, values)
    return res.status(201).json({ ok: true, post: result.rows[0] })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al crear el post' })
  }
}

export const getPosts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public."Post" ORDER BY created_at DESC')
    return res.status(200).json({ ok: true, posts: result.rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener posts' })
  }
}

export const getPostById = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query('SELECT * FROM public."Post" WHERE id = $1', [id])
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Post no encontrado' })
    return res.status(200).json({ ok: true, post: result.rows[0] })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener el post' })
  }
}

export const deletePost = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query('DELETE FROM public."Post" WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Post no encontrado' })
    return res.status(200).json({ ok: true, message: 'Post eliminado', post: result.rows[0] })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al eliminar el post' })
  }
}
