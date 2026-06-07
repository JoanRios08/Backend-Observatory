import { getAcademicOptions } from '../models/academic-relations.models.js';

export const getAcademicCatalogs = async (req, res) => {
  try {
    const options = await getAcademicOptions();
    return res.status(200).json({ ok: true, ...options });
  } catch (error) {
    console.error('Error en getAcademicCatalogs:', error);
    return res.status(500).json({ ok: false, error: 'Error al obtener opciones academicas' });
  }
};
