// src/middleware/auth.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export function signJwt(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

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

export async function registerUser({ email, password }) {
  if (!email || !password) throw new Error("email & password required");

  const normEmail = String(email).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const [u] = await db
      .insert(users)
      .values({ email: normEmail, passwordHash })
      .returning();

    return { id: u.id, email: u.email };
  } catch (err) {
    // Only map actual UNIQUE violations (Postgres 23505) to 409.
    // Log full detail so we can distinguish other issues in Render logs.
    const code = err?.code;
    const detail = err?.detail;
    const constraint = err?.constraint;
    console.error("[registerUser] insert failed", { code, detail, constraint });

    if (code === "23505") {
      // Optional: additionally check constraint name if available
      return Promise.reject(Object.assign(new Error("email already exists"), { status: 409 }));
    }

    // Re-throw anything else so you see the real 500 + log context
    throw err;
  }
}

export async function loginUser({ email, password }) {
  if (!email || !password) throw new Error("email & password required");

  const normEmail = String(email).trim().toLowerCase();

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, normEmail))
    .limit(1);

  const u = rows[0];
  if (!u) throw new Error("invalid credentials");

  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) throw new Error("invalid credentials");

  const token = signJwt({ sub: u.id, email: u.email });
  return { token };
}
