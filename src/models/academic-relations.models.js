import { pool } from '../db.js';

const tableColumnsCache = new Map();

const ACADEMIC_WRITE_FIELDS = ['career_id', 'campus_id', 'campus_career_id'];
const CAREER_LABEL_COLUMNS = ['name', 'title', 'career_name'];
const CAMPUS_LABEL_COLUMNS = ['name', 'title', 'campus_name'];

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
