import { z } from 'zod'

export const projectCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['active', 'completed', 'suspended']).optional(),
  author_id: z.number(),
})

export const projectUpdateSchema = projectCreateSchema.partial()
