import { pool } from '../db.js'

/**
 * 1. CREAR DOCUMENTO: Solo con los campos solicitados
 * Forzamos la fecha de publicación y actualización a "ahora"
 */
export const createDocument = async ({ 
  title, 
  description, 
  type, 
  file_url, 
  author_id, 
  project_id, 
  location_id 
}) => {
  const now = new Date(); // Fecha automática para evitar nulos molestos

  const query = `
    INSERT INTO public."Document" (
      "title",
      "description",
      "type",
      "published_at",
      "file_url",
      "author_id",
      "project_id",
      "location_id",
      "updated_at"
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
    RETURNING *`;

  const values = [
    title, 
    description || null, 
    type, 
    now,           // published_at forzado a hoy
    file_url, 
    author_id, 
    project_id || null, 
    location_id || null,
    now            // updated_at forzado a hoy
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * 2. EDITAR DOCUMENTO: Lógica de actualización automática de fecha
 * Permite editar el contenido principal del documento
 */
export const updateDocument = async (id, body) => {
  const now = new Date();
  
  // 1. Obtener los campos que sí vienen en el body (filtrar undefined)
  const fields = Object.keys(body).filter(key => body[key] !== undefined);
  
  if (fields.length === 0) {
    // Si no enviaron nada, solo actualizamos la fecha de edición
    const result = await pool.query(
      'UPDATE public."Document" SET "updated_at" = $1 WHERE id = $2 RETURNING *',
      [now, id]
    );
    return result.rows[0] || null;
  }

  // 2. Construir la consulta dinámicamente
  // Quedaría algo como: "title" = $1, "description" = $2...
  const setClause = fields
    .map((field, index) => `"${field}" = $${index + 1}`)
    .join(', ');

  // 3. Añadir la fecha de actualización al final
  const query = `
    UPDATE public."Document"
    SET ${setClause}, "updated_at" = $${fields.length + 1}
    WHERE id = $${fields.length + 2}
    RETURNING *`;

  // 4. Preparar los valores: [valor1, valor2, ..., fecha, id]
  const values = [...fields.map(f => body[f]), now, id];

  try {
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error en query de actualización:", error.message);
    throw error; // Esto permite que el controlador vea el error real
  }
}

/**
 * 3. OBTENER TODOS: Con el nombre del autor (JOIN)
 */
export const getAllDocuments = async () => {
  const query = `
    SELECT 
      d.*, 
      u.first_name AS author_name 
    FROM public."Document" d 
    LEFT JOIN public."User" u ON d.author_id = u.id 
    ORDER BY d.created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * 4. OBTENER POR ID
 */
export const getDocumentById = async (id) => {
  const query = `
    SELECT 
      d.*, 
      u.first_name AS author_name 
    FROM public."Document" d 
    LEFT JOIN public."User" u ON d.author_id = u.id 
    WHERE d.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * 5. ELIMINAR DOCUMENTO
 */
export const deleteDocument = async (id) => {
  const result = await pool.query('DELETE FROM public."Document" WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
}