import jwt from 'jsonwebtoken'

export const authenticate = (req, res, next) => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    return res.status(500).json({ ok: false, error: 'JWT no configurado en el servidor' })
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ ok: false, error: 'Token requerido' })

  try {
    const payload = jwt.verify(token, secret)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Token inválido' })
  }
}
