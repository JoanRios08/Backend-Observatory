import { z } from 'zod'

export const postCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  status: z.string().optional(),
  user_id: z.number(),
  category_id: z.number(),
  author_id: z.number(),
})

export const postUpdateSchema = postCreateSchema.partial()
