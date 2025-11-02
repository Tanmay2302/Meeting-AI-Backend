import dotenv from "dotenv";
dotenv.config({ path: ".env", override: true });

import { z } from "zod";

const bool = (v, def = false) => {
  if (v == null) return def;
  const s = String(v).trim();
  if (/^(1|true|yes|on)$/i.test(s)) return true;
  if (/^(0|false|no|off)$/i.test(s)) return false;
  return def;
};

const Raw = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().default("change-me"),

  AI_PROVIDER: z.string().optional(), // 'groq' | 'mock'
  GROQ_API_KEY: z.string().optional(),

  ENABLE_JOBS: z.string().optional(),
  ENABLE_AUTH: z.string().optional(),
  ENABLE_EMBEDDINGS: z.string().optional(),
});

const raw = Raw.parse(process.env);

export const env = {
  NODE_ENV: raw.NODE_ENV ?? "development",
  PORT: Number(raw.PORT ?? 8080),
  DATABASE_URL: raw.DATABASE_URL,

  JWT_SECRET: raw.JWT_SECRET,

  AI_PROVIDER: (raw.AI_PROVIDER ?? "groq").toLowerCase(),
  GROQ_API_KEY: raw.GROQ_API_KEY,

  ENABLE_JOBS: bool(raw.ENABLE_JOBS, true),
  ENABLE_AUTH: bool(raw.ENABLE_AUTH, true),
  ENABLE_EMBEDDINGS: bool(raw.ENABLE_EMBEDDINGS, true),
};
