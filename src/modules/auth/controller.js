import { registerUser, loginUser } from "../../middleware/auth.js";

export async function register(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "email & password required" });
  try {
    const u = await registerUser({ email, password });
    res.status(201).json(u);
  } catch {
    res.status(409).json({ error: "email already exists" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "email & password required" });
  try {
    const { token } = await loginUser({ email, password });
    res.json({ token });
  } catch {
    res.status(401).json({ error: "invalid credentials" });
  }
}
