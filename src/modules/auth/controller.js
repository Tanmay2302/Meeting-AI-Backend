
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
    
    logger.error("auth.register failed", {
      err: String(err),
      code: err?.code,
      detail: err?.detail,
      constraint: err?.constraint,
      stack: err?.stack?.split("\n").slice(0, 3).join(" | "),
    });

    
    if (err?.status === 409 || err?.code === "23505") {
      return res.status(409).json({ error: "email already exists" });
    }

   
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
