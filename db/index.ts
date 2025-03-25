import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const pool = new Pool({
  connectionString: process.env.NEXT_DATABASE_URL_PROD,
})

export const db = drizzle({ client: pool, schema })

export { sql } from "drizzle-orm"