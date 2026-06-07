import {
  createCampus,
  createCampusCareer,
  createCareer,
  deleteCampus,
  deleteCampusCareer,
  deleteCareer,
  getAcademicOptions,
  getCampusById,
  getCampusCareers,
  getCampusCareerById,
  getCampuses,
  getCareerById,
  getCareers,
  updateCampus,
  updateCampusCareer,
  updateCareer,
} from '../models/academic-relations.models.js';

const buildAcademicErrorResponse = (error, fallbackMessage) => {
  if (error && error.code === '23503') {
    return { status: 400, body: { ok: false, error: 'La relacion indicada no existe o el registro tiene dependencias' } };
  }

  if (error && error.code === '23505') {
    return { status: 409, body: { ok: false, error: 'Ya existe un registro con esos datos' } };
  }

  if (error && error.code === '23502') {
    return { status: 400, body: { ok: false, error: 'Faltan campos requeridos' } };
  }

  if (error && error.code === '23514') {
    return { status: 400, body: { ok: false, error: 'Valor no permitido por la base de datos' } };
  }

  return { status: 500, body: { ok: false, error: fallbackMessage } };
};

export const getAcademicCatalogs = async (req, res) => {
  try {
    const options = await getAcademicOptions();
    return res.status(200).json({ ok: true, ...options });
  } catch (error) {
    console.error('Error en getAcademicCatalogs:', error);
    return res.status(500).json({ ok: false, error: 'Error al obtener opciones academicas' });
  }
};

export const getCampusCatalog = async (req, res) => {
  try {
    const campuses = await getCampuses();
    return res.status(200).json({ ok: true, campuses });
  } catch (error) {
    console.error('Error en getCampusCatalog:', error);
    return res.status(500).json({ ok: false, error: 'Error al obtener sedes' });
  }
};

export const getCampus = async (req, res) => {
  try {
    const campus = await getCampusById(req.params.id);
    if (!campus) return res.status(404).json({ ok: false, error: 'Sede no encontrada' });
    return res.status(200).json({ ok: true, campus });
  } catch (error) {
    console.error('Error en getCampus:', error);
    return res.status(500).json({ ok: false, error: 'Error al obtener sede' });
  }
};

export const createCampusCatalog = async (req, res) => {
  try {
    const campus = await createCampus(req.body);
    return res.status(201).json({ ok: true, campus });
  } catch (error) {
    console.error('Error en createCampusCatalog:', error);
    const response = buildAcademicErrorResponse(error, 'Error al crear sede');
    return res.status(response.status).json(response.body);
  }
};

export const updateCampusCatalog = async (req, res) => {
  try {
    const campus = await updateCampus(req.params.id, req.body);
    if (!campus) return res.status(404).json({ ok: false, error: 'Sede no encontrada' });
    return res.status(200).json({ ok: true, campus });
  } catch (error) {
    console.error('Error en updateCampusCatalog:', error);
    const response = buildAcademicErrorResponse(error, 'Error al actualizar sede');
    return res.status(response.status).json(response.body);
  }
};

export const deleteCampusCatalog = async (req, res) => {
  try {
    const campus = await deleteCampus(req.params.id);
    if (!campus) return res.status(404).json({ ok: false, error: 'Sede no encontrada' });
    return res.status(200).json({ ok: true, message: 'Sede eliminada', campus });
  } catch (error) {
    console.error('Error en deleteCampusCatalog:', error);
    const response = buildAcademicErrorResponse(error, 'Error al eliminar sede');
    return res.status(response.status).json(response.body);
  }
};

export const getCareerCatalog = async (req, res) => {
  try {
    const careers = await getCareers();
    return res.status(200).json({ ok: true, careers });
  } catch (error) {
    console.error('Error en getCareerCatalog:', error);
    return res.status(500).json({ ok: false, error: 'Error al obtener carreras' });
  }
};

export const getCareer = async (req, res) => {
  try {
    const career = await getCareerById(req.params.id);
    if (!career) return res.status(404).json({ ok: false, error: 'Carrera no encontrada' });
    return res.status(200).json({ ok: true, career });
  } catch (error) {
    console.error('Error en getCareer:', error);
    return res.status(500).json({ ok: false, error: 'Error al obtener carrera' });
  }
};

export const createCareerCatalog = async (req, res) => {
  try {
    const career = await createCareer(req.body);
    return res.status(201).json({ ok: true, career });
  } catch (error) {
    console.error('Error en createCareerCatalog:', error);
    const response = buildAcademicErrorResponse(error, 'Error al crear carrera');
    return res.status(response.status).json(response.body);
  }
};

export const updateCareerCatalog = async (req, res) => {
  try {
    const career = await updateCareer(req.params.id, req.body);
    if (!career) return res.status(404).json({ ok: false, error: 'Carrera no encontrada' });
    return res.status(200).json({ ok: true, career });
  } catch (error) {
    console.error('Error en updateCareerCatalog:', error);
    const response = buildAcademicErrorResponse(error, 'Error al actualizar carrera');
    return res.status(response.status).json(response.body);
  }
};

export const deleteCareerCatalog = async (req, res) => {
  try {
    const career = await deleteCareer(req.params.id);
    if (!career) return res.status(404).json({ ok: false, error: 'Carrera no encontrada' });
    return res.status(200).json({ ok: true, message: 'Carrera eliminada', career });
  } catch (error) {
    console.error('Error en deleteCareerCatalog:', error);
    const response = buildAcademicErrorResponse(error, 'Error al eliminar carrera');
    return res.status(response.status).json(response.body);
  }
};

export const getCampusCareerCatalog = async (req, res) => {
  try {
    const campusCareers = await getCampusCareers();
    return res.status(200).json({
      ok: true,
      campusCareers,
      campus_careers: campusCareers,
    });
  } catch (error) {
    console.error('Error en getCampusCareerCatalog:', error);
    return res.status(500).json({ ok: false, error: 'Error al obtener carreras por sede' });
  }
};

export const getCampusCareer = async (req, res) => {
  try {
    const campusCareer = await getCampusCareerById(req.params.id);
    if (!campusCareer) return res.status(404).json({ ok: false, error: 'Relacion sede-carrera no encontrada' });
    return res.status(200).json({ ok: true, campusCareer });
  } catch (error) {
    console.error('Error en getCampusCareer:', error);
    return res.status(500).json({ ok: false, error: 'Error al obtener relacion sede-carrera' });
  }
};

export const createCampusCareerCatalog = async (req, res) => {
  try {
    const campusCareer = await createCampusCareer(req.body);
    return res.status(201).json({ ok: true, campusCareer });
  } catch (error) {
    console.error('Error en createCampusCareerCatalog:', error);
    const response = buildAcademicErrorResponse(error, 'Error al crear relacion sede-carrera');
    return res.status(response.status).json(response.body);
  }
};

export const updateCampusCareerCatalog = async (req, res) => {
  try {
    const campusCareer = await updateCampusCareer(req.params.id, req.body);
    if (!campusCareer) return res.status(404).json({ ok: false, error: 'Relacion sede-carrera no encontrada' });
    return res.status(200).json({ ok: true, campusCareer });
  } catch (error) {
    console.error('Error en updateCampusCareerCatalog:', error);
    const response = buildAcademicErrorResponse(error, 'Error al actualizar relacion sede-carrera');
    return res.status(response.status).json(response.body);
  }
};

export const deleteCampusCareerCatalog = async (req, res) => {
  try {
    const campusCareer = await deleteCampusCareer(req.params.id);
    if (!campusCareer) return res.status(404).json({ ok: false, error: 'Relacion sede-carrera no encontrada' });
    return res.status(200).json({ ok: true, message: 'Relacion sede-carrera eliminada', campusCareer });
  } catch (error) {
    console.error('Error en deleteCampusCareerCatalog:', error);
    const response = buildAcademicErrorResponse(error, 'Error al eliminar relacion sede-carrera');
    return res.status(response.status).json(response.body);
  }
};
