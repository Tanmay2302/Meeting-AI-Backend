// src/db/client.js
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import pino from "pino";
import { env } from "../config/env.js";

const logger = pino();

// Use SSL on Render (production). For local dev, keep it off.
const ssl =
  env.NODE_ENV === "production"
    ? { rejectUnauthorized: false } // Render provides trusted certs; skip CA pinning
    : undefined;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl,
  max: 10,
});

pool.on("error", (err) => logger.error({ err }, "PG pool error"));

export const db = drizzle(pool);
