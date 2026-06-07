import { pool } from '../db.js';

const tableColumnsCache = new Map();

const ACADEMIC_WRITE_FIELDS = ['career_id', 'campus_id', 'campus_career_id'];
const CAREER_LABEL_COLUMNS = ['name', 'title', 'career_name'];
const CAREER_DETAIL_COLUMNS = ['id', 'name', 'title', 'career_name', 'acronym', 'created_at', 'updated_at'];
const CAREER_WRITE_FIELDS = new Set(['name', 'title', 'career_name', 'acronym']);
const CAMPUS_LABEL_COLUMNS = ['name', 'title', 'campus_name'];
const CAMPUS_TYPE_COLUMNS = ['type', 'campus_type', 'kind', 'category'];
const CAMPUS_DETAIL_COLUMNS = ['id', 'name', 'title', 'campus_name', 'state', 'type', 'campus_type', 'kind', 'category', 'created_at', 'updated_at'];
const CAMPUS_WRITE_FIELDS = new Set(['name', 'title', 'campus_name', 'state', 'type', 'campus_type', 'kind', 'category']);
const CAMPUS_CAREER_WRITE_FIELDS = new Set(['campus_id', 'career_id']);

export const addAcademicWriteFields = (fields) => {
  for (const field of ACADEMIC_WRITE_FIELDS) {
    fields.add(field);
  }
  return fields;
};

export const getTableColumns = async (tableName) => {
  if (tableColumnsCache.has(tableName)) return tableColumnsCache.get(tableName);

  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
  `, [tableName]);

  const columns = new Set(result.rows.map(row => row.column_name));
  tableColumnsCache.set(tableName, columns);
  return columns;
};

const pickColumn = (columns, candidates) => candidates.find(column => columns.has(column));

const quoted = (alias, column) => `${alias}."${column}"`;

const selectExistingColumns = (columns, alias, fields) =>
  fields
    .filter(field => columns.has(field))
    .map(field => `${quoted(alias, field)} AS "${field}"`);

const orderByLabel = (labelColumn, alias) => (labelColumn ? `ORDER BY ${quoted(alias, labelColumn)} ASC` : 'ORDER BY 1 ASC');

const prepareWrite = async (tableName, body, allowedFields) => {
  const columns = await getTableColumns(tableName);
  const data = {};

  for (const [key, value] of Object.entries(body || {})) {
    if (value === undefined) continue;
    if (!allowedFields.has(key)) continue;
    if (!columns.has(key)) continue;
    data[key] = value;
  }

  return { columns, data };
};

const insertRow = async (table, data) => {
  const keys = Object.keys(data);

  if (keys.length === 0) {
    throw new Error('No hay campos validos para crear el registro');
  }

  const cols = keys.map(key => `"${key}"`).join(', ');
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  const values = keys.map(key => data[key]);

  const result = await pool.query(
    `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );

  return result.rows[0] || null;
};

const updateRow = async (tableName, table, id, body, allowedFields) => {
  const existing = await getAcademicRowById(table, id);
  if (!existing) return null;

  const { columns, data } = await prepareWrite(tableName, body, allowedFields);
  const keys = Object.keys(data).filter(key => key !== 'id');

  if (keys.length === 0) return existing;

  const setParts = keys.map((key, index) => `"${key}" = $${index + 1}`);
  const values = keys.map(key => data[key]);

  if (columns.has('updated_at')) {
    values.push(new Date());
    setParts.push(`"updated_at" = $${values.length}`);
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE ${table} SET ${setParts.join(', ')} WHERE "id" = $${values.length} RETURNING *`,
    values,
  );

  return result.rows[0] || null;
};

const deleteRow = async (table, id) => {
  const result = await pool.query(`DELETE FROM ${table} WHERE "id" = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};

const getAcademicRowById = async (table, id) => {
  const result = await pool.query(`SELECT * FROM ${table} WHERE "id" = $1`, [id]);
  return result.rows[0] || null;
};

export const getAcademicOptions = async () => {
  const [careerColumns, campusColumns, campusCareerColumns] = await Promise.all([
    getTableColumns('careers'),
    getTableColumns('campuses'),
    getTableColumns('campus_careers'),
  ]);

  const careerLabelColumn = pickColumn(careerColumns, CAREER_LABEL_COLUMNS);
  const campusLabelColumn = pickColumn(campusColumns, CAMPUS_LABEL_COLUMNS);
  const campusTypeColumn = pickColumn(campusColumns, CAMPUS_TYPE_COLUMNS);
  const hasCareers = careerColumns.has('id');
  const hasCampuses = campusColumns.has('id');
  const hasCampusCareers = campusCareerColumns.has('id');

  const [careersResult, campusesResult, campusCareersResult] = await Promise.all([
    hasCareers
      ? pool.query(`
          SELECT
            ${selectExistingColumns(careerColumns, 'c', CAREER_DETAIL_COLUMNS).join(', ')},
            ${careerLabelColumn ? `${quoted('c', careerLabelColumn)} AS label` : 'c."id"::text AS label'}
          FROM public.careers c
          ${orderByLabel(careerLabelColumn, 'c')}
        `)
      : Promise.resolve({ rows: [] }),
    hasCampuses
      ? pool.query(`
          SELECT
            ${selectExistingColumns(campusColumns, 'c', CAMPUS_DETAIL_COLUMNS).join(', ')},
            ${campusLabelColumn ? `${quoted('c', campusLabelColumn)} AS label` : 'c."id"::text AS label'}
            ${campusTypeColumn ? `, ${quoted('c', campusTypeColumn)} AS campus_type` : ''}
          FROM public.campuses c
          ${orderByLabel(campusLabelColumn, 'c')}
        `)
      : Promise.resolve({ rows: [] }),
    hasCampusCareers && campusCareerColumns.has('campus_id') && campusCareerColumns.has('career_id')
      ? pool.query(`
          SELECT
            cc."id",
            cc."campus_id",
            cc."career_id"
            ${careerLabelColumn ? `, ${quoted('cr', careerLabelColumn)} AS career_name` : ''}
            ${campusLabelColumn ? `, ${quoted('cm', campusLabelColumn)} AS campus_name` : ''}
            ${campusTypeColumn ? `, ${quoted('cm', campusTypeColumn)} AS campus_type` : ''}
          FROM public.campus_careers cc
          ${hasCareers ? 'LEFT JOIN public.careers cr ON cc."career_id" = cr."id"' : ''}
          ${hasCampuses ? 'LEFT JOIN public.campuses cm ON cc."campus_id" = cm."id"' : ''}
          ORDER BY cc."id" ASC
        `)
      : Promise.resolve({ rows: [] }),
  ]);

  return {
    campuses: campusesResult.rows.map(row => ({
      ...row,
      name: row.label || row.name || row.title || row.campus_name || String(row.id),
      type: row.type || row.campus_type || row.kind || row.category || null,
    })),
    careers: careersResult.rows.map(row => ({
      ...row,
      name: row.label || row.name || row.title || row.career_name || String(row.id),
    })),
    campusCareers: campusCareersResult.rows,
    campus_careers: campusCareersResult.rows,
  };
};

export const getCampuses = async () => {
  const options = await getAcademicOptions();
  return options.campuses;
};

export const getCareers = async () => {
  const options = await getAcademicOptions();
  return options.careers;
};

export const getCampusCareers = async () => {
  const options = await getAcademicOptions();
  return options.campusCareers;
};

export const getCampusById = async (id) => getAcademicRowById('public.campuses', id);

export const createCampus = async (body) => {
  const { data } = await prepareWrite('campuses', body, CAMPUS_WRITE_FIELDS);
  return insertRow('public.campuses', data);
};

export const updateCampus = async (id, body) =>
  updateRow('campuses', 'public.campuses', id, body, CAMPUS_WRITE_FIELDS);

export const deleteCampus = async (id) => deleteRow('public.campuses', id);

export const getCareerById = async (id) => getAcademicRowById('public.careers', id);

export const createCareer = async (body) => {
  const { data } = await prepareWrite('careers', body, CAREER_WRITE_FIELDS);
  return insertRow('public.careers', data);
};

export const updateCareer = async (id, body) =>
  updateRow('careers', 'public.careers', id, body, CAREER_WRITE_FIELDS);

export const deleteCareer = async (id) => deleteRow('public.careers', id);

export const getCampusCareerById = async (id) => getAcademicRowById('public.campus_careers', id);

export const createCampusCareer = async (body) => {
  const { data } = await prepareWrite('campus_careers', body, CAMPUS_CAREER_WRITE_FIELDS);
  return insertRow('public.campus_careers', data);
};

export const updateCampusCareer = async (id, body) =>
  updateRow('campus_careers', 'public.campus_careers', id, body, CAMPUS_CAREER_WRITE_FIELDS);

export const deleteCampusCareer = async (id) => deleteRow('public.campus_careers', id);

export const getAcademicRelationsSelect = async (baseAlias, baseColumns) => {
  const [careerColumns, campusColumns, campusCareerColumns] = await Promise.all([
    getTableColumns('careers'),
    getTableColumns('campuses'),
    getTableColumns('campus_careers'),
  ]);

  const hasCareers = careerColumns.has('id');
  const hasCampuses = campusColumns.has('id');
  const hasCampusCareers = campusCareerColumns.has('id');
  const careerLabelColumn = pickColumn(careerColumns, CAREER_LABEL_COLUMNS);
  const campusLabelColumn = pickColumn(campusColumns, CAMPUS_LABEL_COLUMNS);
  const joins = [];
  const select = [];

  const hasDirectCareer = baseColumns.has('career_id') && hasCareers;
  const hasDirectCampus = baseColumns.has('campus_id') && hasCampuses;
  const hasCampusCareer = baseColumns.has('campus_career_id') && hasCampusCareers;
  const hasCareerThroughCampusCareer = hasCampusCareer && campusCareerColumns.has('career_id') && hasCareers;
  const hasCampusThroughCampusCareer = hasCampusCareer && campusCareerColumns.has('campus_id') && hasCampuses;

  if (hasCampusCareer) {
    joins.push(`LEFT JOIN public.campus_careers cc ON ${baseAlias}."campus_career_id" = cc."id"`);
  }

  if (hasDirectCareer) {
    joins.push(`LEFT JOIN public.careers cd ON ${baseAlias}."career_id" = cd."id"`);
  }

  if (hasCareerThroughCampusCareer) {
    joins.push('LEFT JOIN public.careers ct ON cc."career_id" = ct."id"');
  }

  if (hasDirectCampus) {
    joins.push(`LEFT JOIN public.campuses cmd ON ${baseAlias}."campus_id" = cmd."id"`);
  }

  if (hasCampusThroughCampusCareer) {
    joins.push('LEFT JOIN public.campuses cmt ON cc."campus_id" = cmt."id"');
  }

  if (!baseColumns.has('career_id') && hasCareerThroughCampusCareer) {
    select.push(', cc."career_id" AS career_id');
  }

  if (!baseColumns.has('campus_id') && hasCampusThroughCampusCareer) {
    select.push(', cc."campus_id" AS campus_id');
  }

  if (careerLabelColumn) {
    const careerSources = [];
    if (hasDirectCareer) careerSources.push(quoted('cd', careerLabelColumn));
    if (hasCareerThroughCampusCareer) careerSources.push(quoted('ct', careerLabelColumn));
    if (careerSources.length === 1) select.push(`, ${careerSources[0]} AS career_name`);
    if (careerSources.length > 1) select.push(`, COALESCE(${careerSources.join(', ')}) AS career_name`);
  }

  if (campusLabelColumn) {
    const campusSources = [];
    if (hasDirectCampus) campusSources.push(quoted('cmd', campusLabelColumn));
    if (hasCampusThroughCampusCareer) campusSources.push(quoted('cmt', campusLabelColumn));
    if (campusSources.length === 1) select.push(`, ${campusSources[0]} AS campus_name`);
    if (campusSources.length > 1) select.push(`, COALESCE(${campusSources.join(', ')}) AS campus_name`);
  }

  return {
    select: select.join(''),
    joins: joins.join('\n'),
  };
};
