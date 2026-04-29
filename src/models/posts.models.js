import { pool } from '../db.js';

const POST_TABLE = 'public."Post"';
const POST_WRITE_FIELDS = new Set([
  'title',
  'content',
  'status',
  'user_id',
  'category_id',
  'author_id',
]);

let postColumnsCache = null;

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
    data[key] = value;
  }

  if (isCreate && columns.has('status') && data.status === undefined) {
    data.status = 'pending_approval';
  }

  return data;
};

const getPostOrderBy = async () => {
  const columns = await getPostColumns();
  if (columns.has('created_at')) return 'ORDER BY "created_at" DESC';
  return 'ORDER BY "id" DESC';
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
  const orderBy = await getPostOrderBy();
  const result = await pool.query(`SELECT * FROM ${POST_TABLE} ${orderBy}`);
  return result.rows;
};

export const getPostById = async (id) => {
  const result = await pool.query(`SELECT * FROM ${POST_TABLE} WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

export const deletePost = async (id) => {
  const result = await pool.query(`DELETE FROM ${POST_TABLE} WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};
