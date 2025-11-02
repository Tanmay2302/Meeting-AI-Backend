// src/middleware/auth.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

/**
 * Create a JWT for a user object.
 * @param {{ sub: string, email: string }} payload
 */
export function signJwt(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Conditionally require auth if ENABLE_AUTH=true.
 * If disabled, it just calls next().
 */
export function requireAuthIfEnabled(req, res, next) {
  if (!env.ENABLE_AUTH) return next();

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "unauthorized" });

  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

/**
 * Register a new user (email must be unique).
 * Lowercase + trim email. Rely on DB unique constraint (23505) instead of pre-checks.
 * Returns { id, email }.
 */
export async function registerUser({ email, password }) {
  if (!email || !password) throw new Error("email & password required");

  const normalizedEmail = String(email).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const [u] = await db
      .insert(users)
      .values({ email: normalizedEmail, passwordHash })
      .returning();

    return { id: u.id, email: u.email };
  } catch (err) {
    // Postgres unique violation
    if (err && err.code === "23505") {
      const e = new Error("email already exists");
      e.status = 409;
      throw e;
    }
    throw err;
  }
}

/**
 * Login with email/password → returns { token }.
 * Lowercase + trim email before lookup.
 */
export async function loginUser({ email, password }) {
  if (!email || !password) throw new Error("email & password required");

  const normalizedEmail = String(email).trim().toLowerCase();

  // Use a simple select; avoid .findFirst DRY issues across environments
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const u = rows[0];
  if (!u) throw Object.assign(new Error("invalid credentials"), { status: 401 });

  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) throw Object.assign(new Error("invalid credentials"), { status: 401 });

  const token = signJwt({ sub: u.id, email: u.email });
  return { token };
}
