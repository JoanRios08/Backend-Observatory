import { ZodError } from 'zod'

export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[property] ?? {})
      req[property] = parsed
      return next()
    } catch (err) {
      console.error('validate middleware error:', err)
      if (err instanceof ZodError) {
        const raw = Array.isArray(err.errors) ? err.errors : Array.isArray(err.issues) ? err.issues : []
        const details = raw.map(e => ({ path: (e.path || []).join('.'), message: e.message || String(e) }))
        return res.status(400).json({ ok: false, error: 'Validation failed', details })
      }
      return res.status(400).json({ ok: false, error: 'Invalid request' })
    }
  }
}