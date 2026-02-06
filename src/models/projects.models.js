import { pool } from '../db.js'

/**
 * 1. CREAR PROYECTO
 * Forzamos el estado por defecto y la fecha de actualización.
 */
// src/models/projects.models.js

export const createProject = async ({ name, description, start_date, end_date, status, author_id }) => {
  const now = new Date();
  
  const query = `
    INSERT INTO public."Project" (
      "name", 
      "description", 
      "start_date", 
      "end_date", 
      "status", 
      "author_id", 
      "updated_at"
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING *`;

  const values = [
    name, 
    description || null, 
    start_date || null, 
    end_date || null, 
    status, 
    author_id, 
    now
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * 2. OBTENER TODOS
 * Nota: Asegúrate de si la tabla es "Author" o "User" según tu DB.
 */
export const getAllProjects = async () => {
  const query = `
    SELECT p.*, a.name AS author_name 
    FROM public."Project" p 
    LEFT JOIN public."Author" a ON p.author_id = a.id 
    ORDER BY p.created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * 3. OBTENER POR ID
 */
export const getProjectById = async (id) => {
  const query = `
    SELECT p.*, a.name AS author_name 
    FROM public."Project" p 
    LEFT JOIN public."Author" a ON p.author_id = a.id 
    WHERE p.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * 4. ACTUALIZAR PROYECTO (Dinámico + updated_at)
 * Esta versión inyecta automáticamente la fecha de modificación.
 */
export const updateProject = async (id, body) => {
  const now = new Date();
  const keys = Object.keys(body).filter(k => body[k] !== undefined);
  
  if (keys.length === 0) return null;

  // Construimos la cláusula SET incluyendo siempre updated_at
  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
  const query = `
    UPDATE public."Project" 
    SET ${setClause}, "updated_at" = $${keys.length + 1} 
    WHERE id = $${keys.length + 2} 
    RETURNING *`;

  const values = [...keys.map(k => body[k]), now, id];
  
  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * 5. ELIMINAR PROYECTO
 */
export const deleteProject = async (id) => {
  const result = await pool.query('DELETE FROM public."Project" WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
}