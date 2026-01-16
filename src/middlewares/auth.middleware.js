import jwt from 'jsonwebtoken'

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ ok: false, error: 'Token requerido' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret')
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Token inválido' })
  }
}
