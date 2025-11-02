import { Router } from "express";
import meetingsRouter from "./modules/meetings/routes.js";
import authRouter from "./modules/auth/routes.js";
import { env } from "./config/env.js";

const router = Router();

router.use("/meetings", meetingsRouter);

if (env.ENABLE_AUTH) {
  router.use("/auth", authRouter);
}

export default router;
