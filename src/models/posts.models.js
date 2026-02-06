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
export const updatePost = async (id, body) => {
  const now = new Date();
  
  // 1. Filtramos las llaves que vienen en el body y que no sean undefined
  const fields = Object.keys(body).filter(key => body[key] !== undefined);
  
  if (fields.length === 0) return null;

  // 2. Construimos la cláusula SET dinámicamente: "title"=$1, "content"=$2...
  const setClause = fields
    .map((field, index) => `"${field}" = $${index + 1}`)
    .join(', ');

  // 3. La query incluye la actualización automática de "updated_at"
  const query = `
    UPDATE public."Post"
    SET ${setClause}, "updated_at" = $${fields.length + 1}
    WHERE id = $${fields.length + 2}
    RETURNING *`;

  // 4. Mapeamos los valores en el orden correcto
  const values = [...fields.map(f => body[f]), now, id];

  try {
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error en DB al actualizar Post:", error.message);
    throw error;
  }
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