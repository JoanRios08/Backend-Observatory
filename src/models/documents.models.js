import { pool } from '../db.js'

/**
 * 1. CREAR DOCUMENTO
 */
export const createDocument = async ({
  title,
  description,
  type,
  published_at,   // CORRECCIÓN #8: El parámetro published_at estaba declarado en
                  // el schema y en el controlador pero la función del modelo lo
                  // ignoraba silenciosamente (no aparecía en la desestructuración).
                  // Ahora se recibe y se usa: si el cliente lo envía se respeta,
                  // si no, se asigna la fecha actual como fallback.
  file_url,
  author_id,
  project_id,
  location_id
}) => {
  const now = new Date();

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
    published_at || now,  // usa el valor del cliente o fecha actual
    file_url,
    author_id,
    project_id || null,
    location_id || null,
    now
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * 2. EDITAR DOCUMENTO
 */
export const updateDocument = async (id, body) => {
  const now = new Date();

  const fields = Object.keys(body).filter(key => body[key] !== undefined);

  if (fields.length === 0) {
    const result = await pool.query(
      'UPDATE public."Document" SET "updated_at" = $1 WHERE id = $2 RETURNING *',
      [now, id]
    );
    return result.rows[0] || null;
  }

  const setClause = fields
    .map((field, index) => `"${field}" = $${index + 1}`)
    .join(', ');

  const query = `
    UPDATE public."Document"
    SET ${setClause}, "updated_at" = $${fields.length + 1}
    WHERE id = $${fields.length + 2}
    RETURNING *`;

  const values = [...fields.map(f => body[f]), now, id];

  try {
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error en query de actualización de Document:', error.message);
    throw error;
  }
}

/**
 * 3. OBTENER TODOS
 */
export const getAllDocuments = async () => {
  // CORRECCIÓN #9: El JOIN usaba u.first_name que no existe en la tabla User
  // (la tabla usa la columna "name" según el modelo de usuarios). Esto causaba
  // que la query fallara con un error 42703 (columna inexistente) en producción.
  const query = `
    SELECT 
      d.*, 
      u.name AS author_name 
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
  // CORRECCIÓN #9 (misma que arriba): u.first_name → u.name
  const query = `
    SELECT 
      d.*, 
      u.name AS author_name 
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
