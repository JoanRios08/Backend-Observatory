import { z } from 'zod';

const trimmedString = z.string().trim();
const optionalTrimmedString = z.preprocess(
  value => value === '' ? null : value,
  trimmedString.min(1).optional().nullable(),
);
const requiredId = z.coerce.number().int().positive();

export const campusCreateSchema = z.object({
  name: trimmedString.min(1).max(100),
  state: optionalTrimmedString,
  type: optionalTrimmedString,
});

export const campusUpdateSchema = campusCreateSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'Debe enviar al menos un campo para actualizar' },
);

export const careerCreateSchema = z.object({
  name: trimmedString.min(1).max(100),
  acronym: optionalTrimmedString,
});

export const careerUpdateSchema = careerCreateSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'Debe enviar al menos un campo para actualizar' },
);

export const campusCareerCreateSchema = z.object({
  campus_id: requiredId,
  career_id: requiredId,
});

export const campusCareerUpdateSchema = campusCareerCreateSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'Debe enviar al menos un campo para actualizar' },
);
