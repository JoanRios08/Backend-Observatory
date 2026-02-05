import jwt from 'jsonwebtoken'
import * as usersModel from '../models/users.models.js'

export const getUsers = async (req, res) => {
  try {
    const users = await usersModel.getAllUsers()
    return res.status(200).json({ ok: true, users })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener usuarios' })
  }
}

export const getUserById = async (req, res) => {
  const { id } = req.params
  try {
    const user = await usersModel.getUserById(id)
    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' })
    return res.status(200).json({ ok: true, user })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al obtener el usuario' })
  }
}

export const createUser = async (req, res) => {
  const body = req.body || {}
  const keys = Object.keys(body)
  if (keys.length === 0) return res.status(400).json({ ok: false, error: 'Cuerpo vacío' })

  try {
    const user = await usersModel.createUser(body)
    return res.status(201).json({ ok: true, user })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al crear el usuario' })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Email y contraseña requeridos' })

  try {
    const user = await usersModel.authenticate(email, password)
    if (!user) return res.status(401).json({ ok: false, error: 'Credenciales inválidas' })

    const payload = { id: user.id, email: user.email }
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '1h' })

    // Intenta obtener información del rol (id y nombre)
    let role = null
    try {
      role = await usersModel.getRoleById(user.role_id)
    } catch (e) {
      console.error('Error fetching role for user', user.id, e)
    }

    const responseUser = { id: user.id, email: user.email, role_id: user.role_id ?? null, role_name: role ? role.name : null }

    return res.status(200).json({ ok: true, token, user: responseUser })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al autenticar usuario' })
  }
}

export const updateUser = async (req, res) => {
  const { id } = req.params
  const body = req.body || {}
  const keys = Object.keys(body)
  if (keys.length === 0) return res.status(400).json({ ok: false, error: 'Cuerpo vacío' })

  try {
    const user = await usersModel.updateUser(id, body)
    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' })
    return res.status(200).json({ ok: true, user })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al actualizar el usuario' })
  }
}

export const deleteUser = async (req, res) => {
  const { id } = req.params
  try {
    const user = await usersModel.deleteUser(id)
    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' })
    return res.status(200).json({ ok: true, message: 'Usuario eliminado', user })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ ok: false, error: 'Error al eliminar el usuario' })
  }
}
