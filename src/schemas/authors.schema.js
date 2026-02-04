import { z } from 'zod'

export const authorCreateSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().optional(),
  email: z.string().email().optional(),
})

export const authorUpdateSchema = authorCreateSchema.partial()
