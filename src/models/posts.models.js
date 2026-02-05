import { pool } from '../db.js'

// 1. CREAR POST: Forzamos el estatus y la fecha
export const createPost = async ({ title, content, user_id, category_id, author_id }) => {
  // Ignoramos el 'status' que venga por parámetros y lo definimos aquí directamente
  const fixedStatus = 'pending_approval';
  const now = new Date(); // Fecha de modificación/creación actual

  const query = `
    INSERT INTO public."Post" (
      "title", 
      "content", 
      "status", 
      "user_id", 
      "category_id", 
      "author_id",
      "updated_at"
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING *`;

  const values = [title, content, fixedStatus, user_id, category_id, author_id, now];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// 2. EDITAR POST (Lógica añadida): Actualiza contenido y fecha automáticamente
export const updatePost = async (id, { title, content, category_id }) => {
  const now = new Date(); // Capturamos el momento exacto de la edición

  const query = `
    UPDATE public."Post"
    SET 
      "title" = $1, 
      "content" = $2, 
      "category_id" = $3, 
      "updated_at" = $4
    WHERE id = $5
    RETURNING *`;

  const values = [title, content, category_id, now, id];
  const result = await pool.query(query, values);
  
  return result.rows[0] || null;
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