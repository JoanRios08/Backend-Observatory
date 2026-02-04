import { pool } from '../db.js'
import bcrypt from 'bcryptjs'

export const getAllUsers = async () => {
  const result = await pool.query('SELECT * FROM public."User"')
  return result.rows
}

export const getUserById = async (id) => {
  try {
    const col = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='status'")
    const statusType = (col.rows[0] && col.rows[0].data_type) || null

    if (statusType && statusType.includes('boolean')) {
      const r = await pool.query('SELECT * FROM public."User" WHERE "id" = $1 AND "status" IS NOT TRUE', [id])
      return r.rows[0] || null
    } else if (statusType) {
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

export const updateUser = async (id, body) => {
  const keys = Object.keys(body)
  if (keys.length === 0) return null

  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
  const values = keys.map(k => body[k])
  values.push(id)
  const query = `UPDATE "User" SET ${setClause} WHERE id = $${values.length} RETURNING *`
  const result = await pool.query(query, values)
  return result.rows[0] || null
}

export const deleteUser = async (id) => {
  try {
    const col = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='status'")
    const statusType = (col.rows[0] && col.rows[0].data_type) || null
    let result
    if (statusType && statusType.includes('boolean')) {
      result = await pool.query('UPDATE public."User" SET "status" = $1 WHERE "id" = $2 RETURNING *', [true, id])
    } else if (statusType) {
      result = await pool.query('UPDATE public."User" SET "status" = $1 WHERE "id" = $2 RETURNING *', ['deleted', id])
    } else {
      result = await pool.query('DELETE FROM public."User" WHERE "id" = $1 RETURNING *', [id])
    }
    return result.rows[0] || null
  } catch (error) {
    if (error && error.code === '42703') {
      const result = await pool.query('DELETE FROM "User" WHERE id = $1 RETURNING *', [id])
      return result.rows[0] || null
    }
    throw error
  }
}