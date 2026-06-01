import { pool } from '../db.js'
import { addAcademicWriteFields, getAcademicRelationsSelect } from './academic-relations.models.js'

const PROJECT_TABLE = 'public."Project"'
const PROJECT_WRITE_FIELDS = addAcademicWriteFields(new Set([
  'name',
  'description',
  'start_date',
  'end_date',
  'status',
  'author_id',
]))

let projectColumnsCache = null

const getProjectColumns = async () => {
  if (projectColumnsCache) return projectColumnsCache

  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Project'
  `)

  projectColumnsCache = new Set(result.rows.map(row => row.column_name))
  return projectColumnsCache
}

const prepareProjectWrite = async (body, { isCreate = false } = {}) => {
  const columns = await getProjectColumns()
  const data = {}

  for (const [key, value] of Object.entries(body || {})) {
    if (value === undefined) continue
    if (!PROJECT_WRITE_FIELDS.has(key)) continue
    if (!columns.has(key)) continue
    data[key] = value
  }

  if (isCreate && columns.has('status') && data.status === undefined) {
    data.status = 'active'
  }

  return data
}

const getProjectOrderBy = async () => {
  const columns = await getProjectColumns()
  if (columns.has('created_at')) return 'ORDER BY p."created_at" DESC'
  return 'ORDER BY p."id" DESC'
}

const getProjectSelect = async ({ byId = false } = {}) => {
  const columns = await getProjectColumns()
  const orderBy = byId ? '' : await getProjectOrderBy()
  const authorSelect = columns.has('author_id') ? ', a.name AS author_name' : ''
  const authorJoin = columns.has('author_id')
    ? 'LEFT JOIN public."Author" a ON p.author_id = a.id'
    : ''
  const academicRelations = await getAcademicRelationsSelect('p', columns)
  const where = byId ? 'WHERE p.id = $1' : ''

  return `
    SELECT p.*${authorSelect}${academicRelations.select}
    FROM ${PROJECT_TABLE} p
    ${authorJoin}
    ${academicRelations.joins}
    ${where}
    ${orderBy}
  `
}

export const createProject = async (body) => {
  const data = await prepareProjectWrite(body, { isCreate: true })
  const keys = Object.keys(data)

  if (keys.length === 0) {
    throw new Error('No hay campos validos para crear el proyecto')
  }

  const columns = await getProjectColumns()
  if (columns.has('updated_at') && data.updated_at === undefined) {
    data.updated_at = new Date()
    keys.push('updated_at')
  }

  const cols = keys.map(key => `"${key}"`).join(', ')
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ')
  const values = keys.map(key => data[key])

  const result = await pool.query(
    `INSERT INTO ${PROJECT_TABLE} (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  )

  return result.rows[0]
}

export const getAllProjects = async () => {
  const query = await getProjectSelect()
  const result = await pool.query(query)
  return result.rows
}

export const getProjectById = async (id) => {
  const query = await getProjectSelect({ byId: true })
  const result = await pool.query(query, [id])
  return result.rows[0] || null
}

export const updateProject = async (id, body) => {
  const existing = await getProjectById(id)
  if (!existing) return null

  const data = await prepareProjectWrite(body)
  const keys = Object.keys(data).filter(key => key !== 'id')

  if (keys.length === 0) return existing

  const columns = await getProjectColumns()
  if (columns.has('updated_at')) {
    data.updated_at = new Date()
    keys.push('updated_at')
  }

  const setClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ')
  const values = keys.map(key => data[key])
  values.push(id)

  const result = await pool.query(
    `UPDATE ${PROJECT_TABLE} SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values,
  )

  return result.rows[0] || null
}

export const deleteProject = async (id) => {
  const result = await pool.query(`DELETE FROM ${PROJECT_TABLE} WHERE id = $1 RETURNING *`, [id])
  return result.rows[0] || null
}
