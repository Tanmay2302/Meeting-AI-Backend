// src/db/bootstrap.js
import { pool } from "./client.js";
import { logger } from "../lib/logger.js";

/**
 * Create tables if they don't exist, using NO uuid extensions/defaults.
 * We generate UUIDs in the app (crypto.randomUUID()) for portability.
 */
export async function ensureDatabase() {
  const statements = [
    // users table: NO gen_random_uuid() default
    `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    `,
    // meetings table
    `
    CREATE TABLE IF NOT EXISTS meetings (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      transcript TEXT NOT NULL,
      summary TEXT NULL,
      action_items JSONB NULL,
      status TEXT NOT NULL DEFAULT 'ready', -- 'processing' | 'ready' | 'failed'
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    `,
    // meeting_embeddings table
    `
    CREATE TABLE IF NOT EXISTS meeting_embeddings (
      meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      model TEXT NOT NULL,
      embedding JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    `,
    // optional feature flags
    `
    CREATE TABLE IF NOT EXISTS feature_flags (
      key TEXT PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT FALSE
    );
    `,
  ];

  try {
    for (const sql of statements) {
      await pool.query(sql);
    }
    logger.info("db bootstrap ok (tables ensured without extensions)");
  } catch (err) {
    logger.error("db bootstrap failed", {
      err: String(err),
      stack: err?.stack?.split("\n").slice(0, 3).join(" | "),
    });
    throw err;
  }
}
