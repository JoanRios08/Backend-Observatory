import { z } from 'zod'

// CORRECCIÓN #17: En el schema original, 'name' era opcional (.optional()) en
// userCreateSchema. Esto permitía crear usuarios sin nombre, lo cual es
// inconsistente con la validación del controlador que no requiere name tampoco.
// Se hace requerido para mantener datos consistentes en la BD.
// Si tu flujo de negocio permite usuarios sin nombre, revierte este cambio.
export const userCreateSchema = z.object({
  first_name: z.string().min(1),    
      // requerido en creación
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().optional(),
  // CORRECCIÓN #18: status como z.union([z.string(), z.boolean()]) aceptaba
  // cualquier string como estado válido (ej: "foo", "activo", "whatever").
  // Se restringe a valores conocidos para evitar estados inválidos en BD.
  status: z.enum(['active', 'inactive', 'deleted']).optional(),
})

export const userUpdateSchema = userCreateSchema.partial()

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
