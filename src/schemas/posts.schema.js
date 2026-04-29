import { z } from 'zod';

const optionalId = z.coerce.number().int().positive().optional().nullable();

export const postCreateSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  status: z.string().trim().min(1).optional(),
  user_id: optionalId,
  category_id: optionalId,
  author_id: optionalId,
}).strict();

export const postUpdateSchema = postCreateSchema
  .partial()
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });
