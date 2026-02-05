import { pool } from '../db.js'
import bcrypt from 'bcryptjs'

export const getAllUsers = async () => {
  // Solo traer los que NO están borrados (asumiendo booleano)
  const result = await pool.query('SELECT * FROM public."User" WHERE "status" IS NOT FALSE')
  return result.rows
}

export const getUserById = async (id) => {
  try {
    const col = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='status'")
    const statusType = (col.rows[0] && col.rows[0].data_type) || null

    if (statusType && statusType.includes('boolean')) {
      // CAMBIO: Antes decía IS NOT TRUE (buscaba borrados), ahora busca activos (IS NOT FALSE)
      const r = await pool.query('SELECT * FROM public."User" WHERE "id" = $1 AND "status" IS NOT FALSE', [id])
      return r.rows[0] || null
    } else if (statusType) {
      // Mantiene la lógica para strings: que no sea 'deleted'
      const r = await pool.query('SELECT * FROM public."User" WHERE "id" = $1 AND COALESCE("status", \'\') <> $2', [id, 'deleted'])
      return r.rows[0] || null
    } else {
      const r = await pool.query('SELECT * FROM public."User" WHERE "id" = $1', [id])
      return r.rows[0] || null
    }
  } catch (error) {
    if (error && error.code === '42703') {
      const r = await pool.query('SELECT * FROM "User" WHERE id = $1', [id])
      return r.rows[0] || null
    }
    throw error
  }
}

export const createUser = async (body) => {
  const keys = Object.keys(body)
  const values = [...keys.map(k => body[k])]

  if (body.password) {
    values[keys.indexOf('password')] = await bcrypt.hash(body.password, 10)
  }

  const cols = keys.map(k => `"${k}"`).join(', ')
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
  const query = `INSERT INTO "User" (${cols}) VALUES (${placeholders}) RETURNING *`
  const result = await pool.query(query, values)
  return result.rows[0]
}

export const authenticate = async (email, password) => {
  const result = await pool.query('SELECT * FROM public."User" WHERE "email" = $1', [email])
  if (result.rows.length === 0) return null

  const user = result.rows[0]
  const hash = user.password || user.pass || user.password_hash
  if (!hash) return null

  if (typeof hash === 'string' && hash.startsWith('$2')) {
    const ok = await bcrypt.compare(password, hash)
    return ok ? user : null
  }

  if (password === hash) {
    try {
      const newHash = await bcrypt.hash(password, 10)
      await pool.query('UPDATE public."User" SET "password" = $1 WHERE id = $2', [newHash, user.id])
    } catch (e) {
      console.error('Failed to migrate password to bcrypt for user', user.id, e)
    }
    return user
  }

  return null
}

export const getRoleById = async (roleId) => {
  if (!roleId) return null
  const candidates = [
    'public."Role"', 'public.roles', 'public."roles"', 'public.role',
    '"Role"', 'roles', '"roles"', 'role', '"role"'
  ]

  for (const tbl of candidates) {
    try {
      const r = await pool.query(`SELECT id, name FROM ${tbl} WHERE id = $1 LIMIT 1`, [roleId])
      if (r.rows && r.rows.length) return r.rows[0]
    } catch (e) {
      // Table/column not found - try next candidate
      if (e && (e.code === '42P01' || e.code === '42703')) continue
      throw e
    }
  }

  return null
}

export const updateUser = async (id, body) => {
  const existing = await getUserById(id)
  if (!existing) return null

  const keys = Object.keys(body).filter(k => k !== 'id' && body[k] !== undefined)
  if (keys.length === 0) return existing

  const changed = []
  const values = []

  for (const k of keys) {
    if (k === 'password') {
      // If a password is provided, always hash and update it
      const hashed = await bcrypt.hash(body.password, 10)
      changed.push(k)
      values.push(hashed)
      continue
    }

    const oldVal = existing[k]
    const newVal = body[k]
    const oldStr = oldVal === null || oldVal === undefined ? '' : String(oldVal)
    const newStr = newVal === null || newVal === undefined ? '' : String(newVal)
    if (oldStr !== newStr) {
      changed.push(k)
      values.push(newVal)
    }
  }

  if (changed.length === 0) return existing

  const setClause = changed.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
  // Always update the updated_at timestamp in the DB side
  const query = `UPDATE "User" SET ${setClause}, "updated_at" = NOW() WHERE id = $${values.length + 1} RETURNING *`
  values.push(id)
  const result = await pool.query(query, values)
  return result.rows[0] || null
}

export const deleteUser = async (id) => {
  try {
    // Verificamos el tipo de dato de la columna status
    const col = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='status'")
    const statusType = (col.rows[0] && col.rows[0].data_type) || null
    
    let result
    if (statusType && statusType.includes('boolean')) {
      // CAMBIO: Ahora ponemos status = false para el borrado lógico
      result = await pool.query('UPDATE public."User" SET "status" = $1 WHERE "id" = $2 RETURNING *', [false, id])
    } else if (statusType) {
      result = await pool.query('UPDATE public."User" SET "status" = $1 WHERE "id" = $2 RETURNING *', ['deleted', id])
    } else {
      // Si no existe la columna status, se hace un borrado físico (o podrías lanzar un error)
      result = await pool.query('DELETE FROM public."User" WHERE "id" = $1 RETURNING *', [id])
    }
    return result.rows[0] || null
  } catch (error) {
    // Si falla por columna inexistente (error 42703), borramos físicamente
    if (error && error.code === '42703') {
      const result = await pool.query('DELETE FROM "User" WHERE id = $1 RETURNING *', [id])
      return result.rows[0] || null
    }
    throw error
  }
}