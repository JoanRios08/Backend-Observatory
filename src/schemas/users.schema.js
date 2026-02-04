import { z } from 'zod'

export const userCreateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().optional(),
  status: z.union([z.string(), z.boolean()]).optional(),
})

export const userUpdateSchema = userCreateSchema.partial()

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
