import pg, { Result } from "pg"

export const pool = new pg.Pool({
    user: "postgres",
    host: "localhost",
    password: "Joan08102004.",
    database: "Observatory",
    port: 5432
})

