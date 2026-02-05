import { pool } from '../db.js';
import * as DocumentModel from '../models/documents.models.js';
import * as ProjectModel from '../models/projects.models.js';
import * as UserModel from '../models/users.models.js';

/**
 * Obtiene toda la información consolidada para el Dashboard
 */
export const getDashboardData = async (req, res) => {
  try {
    const [
      allDocuments,
      allProjects,
      allUsers,
      projectsByMonth,
      postsByType
    ] = await Promise.all([
      // 1. Datos para las listas de actividad reciente
      DocumentModel.getAllDocuments(),
      ProjectModel.getAllProjects(), 
      UserModel.getAllUsers(),

      // 2. SQL para Gráfico de Barras: Proyectos creados por mes
      // Usamos COALESCE y to_char para formatear el mes
      pool.query(`
        SELECT 
          to_char(created_at, 'Mon') AS month, 
          COUNT(*) as total 
        FROM public."Project" 
        GROUP BY month, date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at) ASC
      `),

      // 3. SQL para Gráfico de Dona: Distribución de PUBLICACIONES por Tipo
      // Contamos cuántos documentos hay de cada tipo (Tesis, Artículo, etc.)
      pool.query(`
        SELECT 
          type as label, 
          COUNT(*) as value 
        FROM public."Document" 
        GROUP BY type
        ORDER BY value DESC
      `)
    ]);

    res.status(200).json({
      recentActivity: {
        // Tomamos los 5 más recientes para no saturar el JSON
        lastProjects: allProjects.slice(0, 5),
        lastDocuments: allDocuments.slice(0, 5),
        lastLogins: allUsers.slice(0, 5) 
      },
      charts: {
        barChart: projectsByMonth.rows, // Proyectos por mes
        donutChart: postsByType.rows    // Publicaciones por tipo (Dona)
      }
    });
  } catch (error) {
    console.error("Error en getDashboardData:", error);
    res.status(500).json({ 
      ok: false, 
      message: "Error al cargar dashboard", 
      error: error.message 
    });
  }
};

/**
 * CRUD de Documentos (Funciones individuales para rutas específicas)
 */

export const getDocuments = async (req, res) => {
  try {
    const documents = await DocumentModel.getAllDocuments();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await DocumentModel.getDocumentById(id);
    if (!document) return res.status(404).json({ ok: false, message: "No encontrado" });
    res.json(document);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const createDocument = async (req, res) => {
  try {
    const newDoc = await DocumentModel.createDocument(req.body);
    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DocumentModel.deleteDocument(id);
    if (!deleted) return res.status(404).json({ ok: false, message: "ID no encontrado" });
    res.json({ ok: true, message: "Documento eliminado" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};