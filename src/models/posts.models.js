import { pool } from '../db.js';

export const createPost = async ({ title, content, user_id, category_id, author_id }) => {
  const fixedStatus = 'pending_approval';
  const now = new Date();

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
};

/**
 * CORRECCIÓN: updatePost aceptaba cualquier campo incluyendo "status",
 * permitiendo que cualquier usuario cambie un post a 'published' sin pasar
 * por un flujo de aprobación. Se filtra "status" del body en el modelo
 * como segunda línea de defensa (la primera está en el controlador).
 */
export const updatePost = async (id, body) => {
  const now = new Date();

  // Excluir "status" — los cambios de estado van por flujo de aprobación
  const { status: _ignored, ...safeBody } = body;

  const fields = Object.keys(safeBody).filter(key => safeBody[key] !== undefined);

  if (fields.length === 0) return null;

  const setClause = fields
    .map((field, index) => `"${field}" = $${index + 1}`)
    .join(', ');

  const query = `
    UPDATE public."Post"
    SET ${setClause}, "updated_at" = $${fields.length + 1}
    WHERE id = $${fields.length + 2}
    RETURNING *`;

  const values = [...fields.map(f => safeBody[f]), now, id];

  try {
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error en DB al actualizar Post:', error.message);
    throw error;
  }
};

export const getAllPosts = async () => {
  const result = await pool.query('SELECT * FROM public."Post" ORDER BY created_at DESC');
  return result.rows;
};

export const getPostById = async (id) => {
  const result = await pool.query('SELECT * FROM public."Post" WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const deletePost = async (id) => {
  const result = await pool.query('DELETE FROM public."Post" WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};
