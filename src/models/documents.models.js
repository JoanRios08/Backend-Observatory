import { pool } from '../db.js';

// Usamos comillas dobles para respetar la mayúscula en PostgreSQL
const DOCUMENT_TABLE = 'public."Document"';

const DOCUMENT_WRITE_FIELDS = new Set([
  'title',
  'description',
  'type',
  'published_at',
  'file_url',
  'author_id',
  'project_id',
  'location_id',
]);

let documentColumnsCache = null;

/**
 * Obtiene las columnas reales de la tabla para evitar errores de inserción
 * y manejar dinámicamente los JOINS.
 */
const getDocumentColumns = async () => {
  if (documentColumnsCache) return documentColumnsCache;

  try {
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Document'
    `);

    if (result.rows.length === 0) {
      console.error("⚠️ ADVERTENCIA: No se encontraron columnas. Verifica que la tabla 'Document' exista en el esquema 'public'.");
    }

    documentColumnsCache = new Set(result.rows.map(row => row.column_name));
    return documentColumnsCache;
  } catch (error) {
    console.error("Error al obtener metadatos de la tabla:", error.message);
    return new Set();
  }
};

const prepareDocumentWrite = async (body, { isCreate = false } = {}) => {
  const columns = await getDocumentColumns();
  const data = {};

  for (const [key, value] of Object.entries(body || {})) {
    if (value === undefined) continue;
    if (!DOCUMENT_WRITE_FIELDS.has(key)) continue;
    if (!columns.has(key)) continue;
    data[key] = value;
  }

  if (isCreate && columns.has('published_at') && data.published_at === undefined) {
    data.published_at = new Date();
  }

  return data;
};

const getDocumentOrderBy = async () => {
  const columns = await getDocumentColumns();
  if (columns.has('created_at')) return 'ORDER BY d."created_at" DESC';
  return 'ORDER BY d."id" DESC';
};

/**
 * Genera el query de selección dinámico manejando posibles fallos en JOINS
 */
const getDocumentSelect = async ({ byId = false } = {}) => {
  const columns = await getDocumentColumns();
  const orderBy = byId ? '' : await getDocumentOrderBy();
  
  // Verificamos si existen las columnas para los JOINS
  const hasAuthorId = columns.has('author_id');
  
  const authorSelect = hasAuthorId 
    ? ', a.name AS author_name' 
    : '';

  // Nota: Si las tablas Author o User no existen con mayúsculas, esto fallará.
  // Si da error, cambia public."Author" por public.author (minúsculas)
  const authorJoins = hasAuthorId
    ? `LEFT JOIN public."Author" a ON d.author_id = a.id`
    : '';

  const where = byId ? 'WHERE d.id = $1' : '';

  return `
    SELECT d.*${authorSelect}
    FROM ${DOCUMENT_TABLE} d
    ${authorJoins}
    ${where}
    ${orderBy}
  `;
};

export const createDocument = async (body) => {
  const data = await prepareDocumentWrite(body, { isCreate: true });
  const keys = Object.keys(data);

  if (keys.length === 0) {
    throw new Error('No hay campos válidos para crear el documento');
  }

  const columns = await getDocumentColumns();

  if (columns.has('updated_at') && data.updated_at === undefined) {
    data.updated_at = new Date();
    keys.push('updated_at');
  }

  const cols = keys.map(key => `"${key}"`).join(', ');
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  const values = keys.map(key => data[key]);

  const result = await pool.query(
    `INSERT INTO ${DOCUMENT_TABLE} (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );

  return result.rows[0];
};

export const updateDocument = async (id, body) => {
  const existing = await getDocumentById(id);
  if (!existing) return null;

  const data = await prepareDocumentWrite(body);
  const keys = Object.keys(data).filter(key => key !== 'id');

  if (keys.length === 0) return existing;

  const columns = await getDocumentColumns();
  const setParts = keys.map((key, index) => `"${key}" = $${index + 1}`);
  const values = keys.map(key => data[key]);

  if (columns.has('updated_at')) {
    values.push(new Date());
    setParts.push(`"updated_at" = $${values.length}`);
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE ${DOCUMENT_TABLE} SET ${setParts.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values,
  );

  return result.rows[0] || null;
};

export const getAllDocuments = async () => {
  try {
    const query = await getDocumentSelect();
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ ERROR EN QUERY ALL_DOCUMENTS:", error.message);
    throw error; // Re-lanzamos para que el controlador lo capture
  }
};

export const getDocumentById = async (id) => {
  try {
    const query = await getDocumentSelect({ byId: true });
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`❌ ERROR EN GET_DOCUMENT_BY_ID (${id}):`, error.message);
    throw error;
  }
};

export const deleteDocument = async (id) => {
  const result = await pool.query(`DELETE FROM ${DOCUMENT_TABLE} WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};