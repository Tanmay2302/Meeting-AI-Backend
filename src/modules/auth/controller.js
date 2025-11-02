
import { registerUser, loginUser } from "../../middleware/auth.js";
import { logger } from "../../lib/logger.js";

export async function register(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email & password required" });
  }

  try {
    const u = await registerUser({ email, password });
    return res.status(201).json(u);
  } catch (err) {
    // Log full error context so we can see what's really happening in Render
    logger.error("auth.register failed", {
      err: String(err),
      code: err?.code,
      detail: err?.detail,
      constraint: err?.constraint,
      stack: err?.stack?.split("\n").slice(0, 3).join(" | "),
    });

    // Postgres unique violation is 23505; treat that as "email already exists"
    if (err?.status === 409 || err?.code === "23505") {
      return res.status(409).json({ error: "email already exists" });
    }

    // Everything else is a real server error — don't mask it as 409
    return res.status(500).json({ error: "internal" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email & password required" });
  }

  try {
    const { token } = await loginUser({ email, password });
    return res.json({ token });
  } catch (err) {
    // Our loginUser throws Error("invalid credentials") for auth failures.
    // Anything else should be a 500 so we don't hide real server issues.
    const msg = String(err?.message || err || "");
    if (msg.toLowerCase().includes("invalid credentials")) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    logger.error("auth.login failed", {
      err: String(err),
      code: err?.code,
      detail: err?.detail,
      stack: err?.stack?.split("\n").slice(0, 3).join(" | "),
    });
    return res.status(500).json({ error: "internal" });
  }
}
