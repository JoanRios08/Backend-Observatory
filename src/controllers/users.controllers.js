import { pool } from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public."User"');
    return res.status(200).json({ ok: true, users: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al obtener usuarios' });
  }
}

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const col = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='status'");
    const statusType = (col.rows[0] && col.rows[0].data_type) || null;
    let result;
    if (statusType && statusType.includes('boolean')) {
      result = await pool.query('SELECT * FROM public."User" WHERE "id" = $1 AND "status" IS NOT TRUE', [id]);
    } else if (statusType) {
      result = await pool.query('SELECT * FROM public."User" WHERE "id" = $1 AND COALESCE("status", \'\') <> $2', [id, 'deleted']);
    } else {
      result = await pool.query('SELECT * FROM public."User" WHERE "id" = $1', [id]);
    }
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    return res.status(200).json({ ok: true, user: result.rows[0] });
  } catch (error) {
    console.error(error);
    
    if (error.code === '42703') {
      try {
        const result = await pool.query('SELECT * FROM "User" WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        return res.status(200).json({ ok: true, user: result.rows[0], warning: 'status column missing, fallback to simple select' });
      } catch (err) {
        console.error(err);
      }
    }
    return res.status(500).json({ ok: false, error: 'Error al obtener el usuario' });
  }
}

export const createUser = async (req, res) => {
  const body = req.body || {};
  const keys = Object.keys(body);
  if (keys.length === 0) return res.status(400).json({ ok: false, error: 'Cuerpo vacío' });
  try {
    if (body.password) {
      const saltRounds = 10;
      body.password = await bcrypt.hash(body.password, saltRounds);
    }

    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => body[k]);

    const query = `INSERT INTO "User" (${cols}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);
    return res.status(201).json({ ok: true, user: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al crear el usuario' });
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Email y contraseña requeridos' });

  try {
    const result = await pool.query('SELECT * FROM public."User" WHERE "email" = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });

    const user = result.rows[0];
    const hash = user.password || user.pass || user.password_hash;
    if (!hash) return res.status(400).json({ ok: false, error: 'Usuario no tiene contraseña' });

    let match = false;
    
    if (typeof hash === 'string' && hash.startsWith('$2')) {
      match = await bcrypt.compare(password, hash);
    } else {
      
      if (password === hash) {
        match = true;
        try {
          const newHash = await bcrypt.hash(password, 10);
          await pool.query('UPDATE public."User" SET "password" = $1 WHERE id = $2', [newHash, user.id]);
        } catch (e) {
          console.error('Failed to migrate password to bcrypt for user', user.id, e);
        }
      }
    }
    if (!match) return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });

    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '1h' });

    return res.status(200).json({ ok: true, token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al autenticar usuario' });
  }
}

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const keys = Object.keys(body);
  if (keys.length === 0) return res.status(400).json({ ok: false, error: 'Cuerpo vacío' });

  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
  const values = keys.map(k => body[k]);
  values.push(id);

  const query = `UPDATE "User" SET ${setClause} WHERE id = $${values.length} RETURNING *`;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    return res.status(200).json({ ok: true, user: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al actualizar el usuario' });
  }
}

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const col = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='status'");
    const statusType = (col.rows[0] && col.rows[0].data_type) || null;
    let result;
    if (statusType && statusType.includes('boolean')) {
      result = await pool.query('UPDATE public."User" SET "status" = $1 WHERE "id" = $2 RETURNING *', [true, id]);
    } else if (statusType) {
      result = await pool.query('UPDATE public."User" SET "status" = $1 WHERE "id" = $2 RETURNING *', ['deleted', id]);
    } else {
      result = await pool.query('DELETE FROM public."User" WHERE "id" = $1 RETURNING *', [id]);
    }
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    return res.status(200).json({ ok: true, message: 'Usuario eliminado lógicamente', user: result.rows[0] });
  } catch (error) {
    console.error(error);
    
    if (error.code === '42703') {
      try {
        const result = await pool.query('DELETE FROM "User" WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        return res.status(200).json({ ok: true, message: 'Usuario eliminado físicamente (fallback)', user: result.rows[0] });
      } catch (err) {
        console.error(err);
      }
    }
    return res.status(500).json({ ok: false, error: 'Error al eliminar el usuario' });
  }
}
