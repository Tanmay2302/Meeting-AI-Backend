import { Router } from "express";
import {
  postMeeting,
  getMeetings,
  getMeetingById,
  postForceSummarize,
} from "./controller.js";
import { requireAuthIfEnabled } from "../../middleware/auth.js";

const r = Router();

r.post("/api/v1/meetings", requireAuthIfEnabled, postMeeting);
r.get("/api/v1/meetings", getMeetings);
r.get("/api/v1/meetings/:id", getMeetingById);
r.post(
  "/api/v1/meetings/:id/force-summarize",
  requireAuthIfEnabled,
  postForceSummarize
);

export default r;
