import { pool } from '../db.js';
import bcrypt from 'bcryptjs';

/**
 * CORRECCIÓN 1: getAllUsers usaba WHERE u."status" IS NOT FALSE, que es una
 * comparación válida solo para columnas BOOLEAN. Si "status" es TEXT (p.ej.
 * 'active'/'deleted'), IS NOT FALSE siempre es TRUE y nunca filtra nada.
 * Se adopta la misma lógica dinámica que ya existía en getUserById y deleteUser.
 */
export const getAllUsers = async () => {
  // Detectar el tipo de la columna status
  const col = await pool.query(`
    SELECT data_type FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='User' AND column_name='status'
  `);
  const statusType = (col.rows[0] && col.rows[0].data_type) || null;

  let query;
  if (statusType && statusType.includes('boolean')) {
    query = `
      SELECT u.*, r.name AS role_name 
      FROM public."User" u
      LEFT JOIN public."Role" r ON u.role_id = r.id
      WHERE u."status" IS NOT FALSE
      ORDER BY u.created_at DESC
    `;
  } else if (statusType) {
    // Columna text: excluir usuarios marcados como 'deleted'
    query = `
      SELECT u.*, r.name AS role_name 
      FROM public."User" u
      LEFT JOIN public."Role" r ON u.role_id = r.id
      WHERE COALESCE(u."status", '') <> 'deleted'
      ORDER BY u.created_at DESC
    `;
  } else {
    // Sin columna status: traer todos
    query = `
      SELECT u.*, r.name AS role_name 
      FROM public."User" u
      LEFT JOIN public."Role" r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `;
  }

  const result = await pool.query(query);
  return result.rows;
};

export const getUserById = async (id) => {
  try {
    const col = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='User' AND column_name='status'
    `);
    const statusType = (col.rows[0] && col.rows[0].data_type) || null;

    const queryBase = `
      SELECT u.*, r.name AS role_name 
      FROM public."User" u
      LEFT JOIN public."Role" r ON u.role_id = r.id
      WHERE u.id = $1
    `;

    if (statusType && statusType.includes('boolean')) {
      const r = await pool.query(`${queryBase} AND u."status" IS NOT FALSE`, [id]);
      return r.rows[0] || null;
    } else if (statusType) {
      const r = await pool.query(`${queryBase} AND COALESCE(u."status", '') <> $2`, [id, 'deleted']);
      return r.rows[0] || null;
    } else {
      const r = await pool.query(queryBase, [id]);
      return r.rows[0] || null;
    }
  } catch (error) {
    if (error && error.code === '42703') {
      const r = await pool.query(`
        SELECT u.*, r.name AS role_name 
        FROM "User" u 
        LEFT JOIN "Role" r ON u.role_id = r.id 
        WHERE u.id = $1
      `, [id]);
      return r.rows[0] || null;
    }
    throw error;
  }
};

/**
 * CORRECCIÓN 2: createUser construía la query con INSERT INTO "User" sin
 * el schema "public", lo que puede fallar dependiendo del search_path de la
 * conexión. Se estandariza a public."User".
 *
 * CORRECCIÓN 3: El orden de construcción de "values" era correcto pero
 * se rehacía innecesariamente. Se simplifica sin cambiar el comportamiento.
 */
export const createUser = async (body) => {
  const keys = Object.keys(body);
  const values = keys.map(k => body[k]);

  // Hashear contraseña si viene en texto plano
  const pwIndex = keys.indexOf('password');
  if (pwIndex !== -1) {
    values[pwIndex] = await bcrypt.hash(body.password, 10);
  }

  const cols = keys.map(k => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  // CORRECCIÓN 2: schema explícito
  const query = `INSERT INTO public."User" (${cols}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const authenticate = async (email, password) => {
  const query = `
    SELECT u.*, r.name AS role_name 
    FROM public."User" u
    LEFT JOIN public."Role" r ON u.role_id = r.id
    WHERE u."email" = $1
  `;
  const result = await pool.query(query, [email]);
  if (result.rows.length === 0) return null;

  const user = result.rows[0];
  const hash = user.password || user.pass || user.password_hash;
  if (!hash) return null;

  if (typeof hash === 'string' && hash.startsWith('$2')) {
    const ok = await bcrypt.compare(password, hash);
    return ok ? user : null;
  }

  // Contraseña en texto plano (legado): migrar a bcrypt
  if (password === hash) {
    try {
      const newHash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE public."User" SET "password" = $1 WHERE id = $2', [newHash, user.id]);
    } catch (e) {
      console.error('Failed to migrate password to bcrypt for user', user.id, e);
    }
    return user;
  }

  return null;
};

export const getRoleById = async (roleId) => {
  if (!roleId) return null;
  const candidates = [
    'public."Role"', 'public.roles', 'public."roles"', 'public.role',
    '"Role"', 'roles', '"roles"', 'role', '"role"',
  ];

  for (const tbl of candidates) {
    try {
      const r = await pool.query(`SELECT id, name FROM ${tbl} WHERE id = $1 LIMIT 1`, [roleId]);
      if (r.rows && r.rows.length) return r.rows[0];
    } catch (e) {
      if (e && (e.code === '42P01' || e.code === '42703')) continue;
      throw e;
    }
  }
  return null;
};

export const updateUser = async (id, body) => {
  const existing = await getUserById(id);
  if (!existing) return null;

  const keys = Object.keys(body).filter(k => k !== 'id' && body[k] !== undefined);
  if (keys.length === 0) return existing;

  const changed = [];
  const values = [];

  for (const k of keys) {
    if (k === 'password') {
      const hashed = await bcrypt.hash(body.password, 10);
      changed.push(k);
      values.push(hashed);
      continue;
    }

    const oldVal = existing[k];
    const newVal = body[k];
    const oldStr = oldVal === null || oldVal === undefined ? '' : String(oldVal);
    const newStr = newVal === null || newVal === undefined ? '' : String(newVal);
    if (oldStr !== newStr) {
      changed.push(k);
      values.push(newVal);
    }
  }

  if (changed.length === 0) return existing;

  const setClause = changed.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
  // CORRECCIÓN 2: schema explícito
  const query = `UPDATE public."User" SET ${setClause}, "updated_at" = NOW() WHERE id = $${values.length + 1} RETURNING *`;
  values.push(id);
  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const deleteUser = async (id) => {
  try {
    const col = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='User' AND column_name='status'
    `);
    const statusType = (col.rows[0] && col.rows[0].data_type) || null;

    let result;
    if (statusType && statusType.includes('boolean')) {
      result = await pool.query('UPDATE public."User" SET "status" = $1 WHERE "id" = $2 RETURNING *', [false, id]);
    } else if (statusType) {
      result = await pool.query('UPDATE public."User" SET "status" = $1 WHERE "id" = $2 RETURNING *', ['deleted', id]);
    } else {
      result = await pool.query('DELETE FROM public."User" WHERE "id" = $1 RETURNING *', [id]);
    }
    return result.rows[0] || null;
  } catch (error) {
    if (error && error.code === '42703') {
      // CORRECCIÓN 2: schema explícito en el fallback
      const result = await pool.query('DELETE FROM public."User" WHERE id = $1 RETURNING *', [id]);
      return result.rows[0] || null;
    }
    throw error;
  }
};
