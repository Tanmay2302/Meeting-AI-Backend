// src/index.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

import { ensureDatabase } from "./db/bootstrap.js";
import authRoutes from "./modules/auth/routes.js";
import meetingRoutes from "./modules/meetings/routes.js";
import { initQueue } from "./lib/queue/queue.js";

async function main() {
  // 1) Ensure DB (extensions & tables) exist before anything else
  await ensureDatabase();

  // 2) App setup
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // 3) Swagger UI from src/openapi.json
  const openapiPath = path.resolve(process.cwd(), "src", "openapi.json");
  if (fs.existsSync(openapiPath)) {
    try {
      const spec = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));
      app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
      logger.info("swagger mounted", { path: "/docs", file: openapiPath });
    } catch (err) {
      logger.error("failed to load openapi.json", { err: String(err) });
    }
  } else {
    logger.warn("openapi.json not found; Swagger UI not mounted");
  }

  // 4) Start lightweight in-memory queue (async summaries)
  if (env.ENABLE_JOBS) {
    await initQueue();
  }

  // 5) Health check
  app.get("/health", (_req, res) =>
    res.json({
      status: "ok",
      env: env.NODE_ENV,
      time: new Date().toISOString(),
    })
  );

  // 6) Routes
  app.use(authRoutes);
  app.use(meetingRoutes);

  // 7) Global error handler
  app.use((err, _req, res, _next) => {
    logger.error("unhandled", { err: String(err) });
    res.status(500).json({ error: "internal" });
  });

  // 8) Listen
  app.listen(env.PORT, () => {
    logger.info("server listening", {
      port: env.PORT,
      jobs: env.ENABLE_JOBS,
      auth: env.ENABLE_AUTH,
      embeddings: env.ENABLE_EMBEDDINGS,
      provider: env.AI_PROVIDER,
    });
  });
}

// Boot and crash loudly if something is wrong
main().catch((err) => {
  logger.error("fatal startup error", { err: String(err) });
  process.exit(1);
});
