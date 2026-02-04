import pg from "pg"
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL || null

export const pool = connectionString
    ? new pg.Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    })
    : new pg.Pool({
        user: process.env.DB_USER || "postgres",
        host: process.env.DB_HOST || "localhost",
        password: process.env.DB_PASSWORD || "Joan08102004.",
        database: process.env.DB_NAME || "Observatory",
        port: Number(process.env.DB_PORT) || 5432
    })

