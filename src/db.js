import pg from "pg"
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL || null
const isRender = !!process.env.RENDER || !!process.env.RENDER_SERVICE_ID
const isProduction = process.env.NODE_ENV === 'production' || isRender

const ssl = connectionString ? { rejectUnauthorized: false } : false

const poolConfig = connectionString
  ? {
      connectionString,
      ssl,
      max: Number(process.env.DB_MAX_CLIENTS) || 10,
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
      connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS) || 2000
    }
  : {
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "Observatory",
      port: Number(process.env.DB_PORT) || 5432
    }

export const pool = new pg.Pool(poolConfig)



