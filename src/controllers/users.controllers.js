import jwt from 'jsonwebtoken';
import * as usersModel from '../models/users.models.js';

/**
 * CORRECCIÓN GLOBAL: Todos los endpoints que devuelven un objeto "user"
 * lo hacían incluyendo el campo "password" (hash bcrypt). Se añade la función
 * sanitizeUser para eliminarlo antes de enviarlo al cliente.
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, pass, password_hash, ...safe } = user;
  return safe;
};

export const getUsers = async (req, res) => {
  try {
    const users = await usersModel.getAllUsers();
    // CORRECCIÓN 1: Se mapea cada usuario por sanitizeUser para quitar passwords
    return res.status(200).json({ ok: true, users: users.map(sanitizeUser) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al obtener usuarios' });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await usersModel.getUserById(id);
    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    // CORRECCIÓN 1: password eliminada de la respuesta
    return res.status(200).json({ ok: true, user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al obtener el usuario' });
  }
};

/**
 * CORRECCIÓN 2: createUser no validaba que "email" y "password" estuvieran
 * presentes. Cualquier body con al menos una clave pasaba la validación,
 * permitiendo crear usuarios sin credenciales.
 */
export const createUser = async (req, res) => {
  const body = req.body || {};

  if (!body.email || !body.password) {
    return res.status(400).json({ ok: false, error: 'Email y contraseña son requeridos' });
  }

  try {
    const user = await usersModel.createUser(body);
    // CORRECCIÓN 1: password eliminada de la respuesta
    return res.status(201).json({ ok: true, user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al crear el usuario' });
  }
};

/**
 * CORRECCIÓN 3: login devolvía el objeto "user" completo del modelo authenticate(),
 * que incluía el hash de la contraseña. Se sanitiza antes de responder.
 *
 * CORRECCIÓN 4: El payload del JWT incluía solo id y email, pero no el role_id.
 * Esto obligaba a hacer una query extra en cada request autenticado para saber
 * el rol. Se incluye role_id en el payload para facilitar autorización en middlewares.
 */
export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email y contraseña requeridos' });
  }

  try {
    const user = await usersModel.authenticate(email, password);
    if (!user) return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });

    // CORRECCIÓN 4: role_id incluido en el payload del token
    const payload = { id: user.id, email: user.email, role_id: user.role_id ?? null };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '1h' });

    let role = null;
    try {
      role = await usersModel.getRoleById(user.role_id);
    } catch (e) {
      console.error('Error fetching role for user', user.id, e);
    }

    // CORRECCIÓN 3: Se construye responseUser sin exponer el hash
    const responseUser = {
      id: user.id,
      email: user.email,
      role_id: user.role_id ?? null,
      role_name: role ? role.name : null,
    };

    return res.status(200).json({ ok: true, token, user: responseUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al autenticar usuario' });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};

  if (Object.keys(body).length === 0) {
    return res.status(400).json({ ok: false, error: 'Cuerpo vacío' });
  }

  try {
    const user = await usersModel.updateUser(id, body);
    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    // CORRECCIÓN 1: password eliminada de la respuesta
    return res.status(200).json({ ok: true, user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al actualizar el usuario' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await usersModel.deleteUser(id);
    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    // CORRECCIÓN 1: password eliminada de la respuesta
    return res.status(200).json({ ok: true, message: 'Usuario eliminado', user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al eliminar el usuario' });
  }
};
