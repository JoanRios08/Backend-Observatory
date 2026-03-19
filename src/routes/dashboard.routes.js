import { Router } from 'express';
import * as dashboardCtrl from '../controllers/dashboard.controllers.js';

const router = Router();

// CORRECCIÓN #5: Se eliminaron las rutas duplicadas de /documents y /documents/:id.
// dashboard.routes.js registraba GET /documents, GET /documents/:id, POST /documents
// y DELETE /documents/:id, que son exactamente las mismas rutas que ya maneja
// documents.routes.js. Tener dos routers atendiendo la misma ruta provoca que:
//   - El primero registrado gana siempre (comportamiento confuso).
//   - Los controladores del dashboard no tienen la misma lógica de respuesta
//     que los de documents (ej: dashboard.getDocuments devuelve el array crudo
//     sin la envoltura { ok, documents }).
//   - El validate(documentCreateSchema) en el POST del dashboard era redundante
//     e inconsistente con el manejo de errores del resto de la app.
// Solución: el dashboard solo expone su ruta propia (/dashboard/summary).
// El CRUD de documentos lo gestiona exclusivamente documents.routes.js.

router.get('/dashboard/summary', dashboardCtrl.getDashboardData);

export default router;
