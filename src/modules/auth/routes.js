import { Router } from "express";
import { register, login } from "./controller.js";
const r = Router();
r.post("/api/v1/auth/register", register);
r.post("/api/v1/auth/login", login);
export default r;
