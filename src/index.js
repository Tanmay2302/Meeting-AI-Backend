// src/index.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

import { ensureDatabase } from "./db/bootstrap.js"; // 👈 add this
import authRoutes from "./modules/auth/routes.js";
import meetingRoutes from "./modules/meetings/routes.js";
import { initQueue } from "./lib/queue/queue.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Swagger
const openapiPath = path.resolve(process.cwd(), "src", "docs", "openapi.json");
if (fs.existsSync(openapiPath)) {
  const spec = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
  logger.info("swagger mounted", { path: "/docs" });
}

(async () => {
  // ✅ ensure tables/extensions exist in Render DB
  await ensureDatabase();

  // Queue (in-memory) if enabled
  if (env.ENABLE_JOBS) await initQueue();

  app.get("/health", (_req, res) =>
    res.json({ status: "ok", env: env.NODE_ENV, time: new Date().toISOString() })
  );

  app.use(authRoutes);
  app.use(meetingRoutes);

  app.use((err, _req, res, _next) => {
    logger.error("unhandled", { err: String(err) });
    res.status(500).json({ error: "internal" });
  });

  app.listen(env.PORT, () => {
    logger.info("server listening", {
      port: env.PORT,
      jobs: env.ENABLE_JOBS,
      auth: env.ENABLE_AUTH,
      embeddings: env.ENABLE_EMBEDDINGS,
      provider: env.AI_PROVIDER,
    });
  });
})().catch((err) => {
  logger.error("fatal startup error", { err: String(err) });
  process.exit(1);
});
