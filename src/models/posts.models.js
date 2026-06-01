import { pool } from '../db.js';
import { addAcademicWriteFields, getAcademicRelationsSelect } from './academic-relations.models.js';

const POST_TABLE = 'public."Post"';
const POST_WRITE_FIELDS = addAcademicWriteFields(new Set([
  'title',
  'content',
  'status',
  'user_id',
  'category_id',
  'author_id',
]));

let postColumnsCache = null;

const POST_STATUS_TO_STORAGE = {
  approved: 'published',
};

const normalizePostWriteValue = (key, value) => {
  if (key !== 'status' || value === null) return value;
  return POST_STATUS_TO_STORAGE[value] || value;
};

const getPostColumns = async () => {
  if (postColumnsCache) return postColumnsCache;

  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Post'
  `);

  postColumnsCache = new Set(result.rows.map(row => row.column_name));
  return postColumnsCache;
};

const preparePostWrite = async (body, { isCreate = false } = {}) => {
  const columns = await getPostColumns();
  const data = {};

  for (const [key, value] of Object.entries(body || {})) {
    if (value === undefined) continue;
    if (!POST_WRITE_FIELDS.has(key)) continue;
    if (!columns.has(key)) continue;
    data[key] = normalizePostWriteValue(key, value);
  }

  if (isCreate && columns.has('status') && data.status === undefined) {
    data.status = 'pending_approval';
  }

  return data;
};

const getPostOrderBy = async () => {
  const columns = await getPostColumns();
  if (columns.has('created_at')) return 'ORDER BY p."created_at" DESC';
  return 'ORDER BY p."id" DESC';
};

const getPostSelect = async ({ byId = false } = {}) => {
  const columns = await getPostColumns();
  const orderBy = byId ? '' : await getPostOrderBy();
  const academicRelations = await getAcademicRelationsSelect('p', columns);
  const where = byId ? 'WHERE p.id = $1' : '';

  return `
    SELECT p.*${academicRelations.select}
    FROM ${POST_TABLE} p
    ${academicRelations.joins}
    ${where}
    ${orderBy}
  `;
};

export const createPost = async (body) => {
  const data = await preparePostWrite(body, { isCreate: true });
  const keys = Object.keys(data);

  if (keys.length === 0) {
    throw new Error('No hay campos validos para crear el post');
  }

  const cols = keys.map(key => `"${key}"`).join(', ');
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  const values = keys.map(key => data[key]);

  const result = await pool.query(
    `INSERT INTO ${POST_TABLE} (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );

  return result.rows[0];
};

export const updatePost = async (id, body) => {
  const existing = await getPostById(id);
  if (!existing) return null;

  const data = await preparePostWrite(body);
  const keys = Object.keys(data).filter(key => key !== 'id');

  if (keys.length === 0) return existing;

  const columns = await getPostColumns();
  const setParts = keys.map((key, index) => `"${key}" = $${index + 1}`);
  const values = keys.map(key => data[key]);

  if (columns.has('updated_at')) {
    values.push(new Date());
    setParts.push(`"updated_at" = $${values.length}`);
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE ${POST_TABLE} SET ${setParts.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values,
  );

  return result.rows[0] || null;
};

export const getAllPosts = async () => {
  const query = await getPostSelect();
  const result = await pool.query(query);
  return result.rows;
};

export const getPostById = async (id) => {
  const query = await getPostSelect({ byId: true });
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

export const deletePost = async (id) => {
  const result = await pool.query(`DELETE FROM ${POST_TABLE} WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};
