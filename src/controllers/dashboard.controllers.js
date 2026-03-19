import { pool } from '../db.js';
import * as DocumentModel from '../models/documents.models.js';
import * as ProjectModel from '../models/projects.models.js';
import * as UserModel from '../models/users.models.js';

/**
 * Obtiene toda la información consolidada para el Dashboard
 *
 * CORRECCIONES:
 * 1. Se agregaron conteos totales (totalDocuments, totalProjects, totalUsers)
 *    que antes no se enviaban, dejando el dashboard sin estadísticas globales.
 * 2. La consulta del donutChart usaba la tabla "Document" pero el dashboard
 *    lo llamaba "postsByType", generando confusión semántica. Se renombró
 *    correctamente a documentsByType.
 * 3. Se añadió ordenamiento consistente en recentActivity (los modelos ya
 *    ordenan por created_at DESC, pero se dejaba sin limite en allUsers).
 */
export const getDashboardData = async (req, res) => {
  try {
    const [
      allDocuments,
      allProjects,
      allUsers,
      projectsByMonth,
      documentsByType
    ] = await Promise.all([
      DocumentModel.getAllDocuments(),
      ProjectModel.getAllProjects(),
      UserModel.getAllUsers(),

      // Gráfico de barras: Proyectos creados por mes
      pool.query(`
        SELECT 
          to_char(created_at, 'Mon') AS month, 
          COUNT(*) AS total 
        FROM public."Project" 
        GROUP BY month, date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at) ASC
      `),

      // Gráfico de dona: Distribución de documentos por tipo
      pool.query(`
        SELECT 
          type AS label, 
          COUNT(*) AS value 
        FROM public."Document" 
        GROUP BY type
        ORDER BY value DESC
      `)
    ]);

    res.status(200).json({
      // CORRECCIÓN 1: Se agregan totales que faltaban
      stats: {
        totalDocuments: allDocuments.length,
        totalProjects: allProjects.length,
        totalUsers: allUsers.length,
      },
      recentActivity: {
        lastProjects: allProjects.slice(0, 5),
        lastDocuments: allDocuments.slice(0, 5),
        lastLogins: allUsers.slice(0, 5),
      },
      charts: {
        barChart: projectsByMonth.rows,
        // CORRECCIÓN 2: renombrado de postsByType → documentsByType (coherencia semántica)
        donutChart: documentsByType.rows,
      }
    });
  } catch (error) {
    console.error('Error en getDashboardData:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al cargar dashboard',
      error: error.message
    });
  }
};

// ─── CRUD de Documentos (usado desde dashboard.routes.js) ────────────────────
// CORRECCIÓN 3: Se añade updateDocument que existía en documents.routes.js
// pero estaba ausente aquí, dejando el PUT de documentos sin handler en dashboard.

export const getDocuments = async (req, res) => {
  try {
    const documents = await DocumentModel.getAllDocuments();
    res.json({ ok: true, documents });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await DocumentModel.getDocumentById(id);
    if (!document) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, document });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const createDocument = async (req, res) => {
  try {
    const newDoc = await DocumentModel.createDocument(req.body);
    res.status(201).json({ ok: true, document: newDoc });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// CORRECCIÓN 3: Handler de actualización que faltaba
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await DocumentModel.updateDocument(id, req.body);
    if (!document) return res.status(404).json({ ok: false, message: 'Documento no encontrado' });
    res.json({ ok: true, document });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DocumentModel.deleteDocument(id);
    if (!deleted) return res.status(404).json({ ok: false, message: 'ID no encontrado' });
    res.json({ ok: true, message: 'Documento eliminado' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};