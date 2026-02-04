import { ZodError } from 'zod'

export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[property] || {})
      req[property] = parsed
      return next()
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        return res.status(400).json({ ok: false, error: 'Validation failed', details })
      }
      return res.status(400).json({ ok: false, error: 'Invalid request' })
    }
  }
}
