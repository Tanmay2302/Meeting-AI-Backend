// src/db/bootstrap.js
import { pool } from "./client.js";
import { logger } from "../lib/logger.js";

const SQL = /* sql */ `
-- 1) UUIDs for primary keys
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) meetings
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  transcript TEXT NOT NULL,
  summary TEXT NULL,
  action_items JSONB NULL,
  status TEXT NOT NULL DEFAULT 'ready', -- 'processing' | 'ready' | 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) meeting_embeddings
CREATE TABLE IF NOT EXISTS meeting_embeddings (
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  embedding JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional: feature flags (safe if it already exists)
CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE
);
`;

export async function ensureDatabase() {
  try {
    await pool.query(SQL);
    logger.info("db bootstrap ok (extensions & tables ensured)");
  } catch (err) {
    logger.error("db bootstrap failed", { err: String(err) });
    throw err;
  }
}
