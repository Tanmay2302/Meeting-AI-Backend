
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

// Enable SSL only in production (Render)
const ssl =
  env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl,
  max: 10,
});

pool.on("error", (err) => logger.error("PG pool error", { err: String(err) }));

export const db = drizzle(pool);
