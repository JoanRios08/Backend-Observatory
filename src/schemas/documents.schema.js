import { z } from 'zod'

export const documentCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().min(1),
  published_at: z.string().optional(),
  file_url: z.string().url(),
  author_id: z.number(),
  project_id: z.number().optional(),
  location_id: z.number().optional(),
})

export const documentUpdateSchema = documentCreateSchema.partial()
