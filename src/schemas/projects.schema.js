import { z } from 'zod'

// CORRECCIÓN #19: El .passthrough() en ambos schemas permitía que cualquier
// campo extra del body (ej: author_name, id, created_at) pasara la validación
// y llegara al modelo, donde podría inyectarse en queries dinámicas.
// El comentario decía que era para "recibir author_name", pero author_name es
// un campo de lectura que viene del JOIN en las queries GET — nunca debe
// enviarse ni escribirse en el INSERT/UPDATE de Project.
// Se elimina .passthrough() para que Zod rechace campos desconocidos.
export const projectCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['active', 'completed', 'suspended']).optional(),
  author_id: z.number(),
})

export const projectUpdateSchema = projectCreateSchema.partial()
