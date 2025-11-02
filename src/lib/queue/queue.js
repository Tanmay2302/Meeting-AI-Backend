import { summarizeJobHandler } from "./jobs.js";
import { logger } from "../logger.js";

export const QUEUE_SUMMARIZE = "summarizeMeeting";

let started = false;
const q = [];
let working = false;

const nextId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function processNext() {
  if (working) return;
  const job = q.shift();
  if (!job) return;

  working = true;
  try {
    await summarizeJobHandler({ id: job.id, data: job.data });
    logger.info("job done", { queue: job.name, jobId: job.id });
  } catch (err) {
    logger.error("job failed", {
      queue: job.name,
      jobId: job.id,
      err: String(err),
    });
  } finally {
    working = false;
    setImmediate(processNext);
  }
}

export async function initQueue() {
  if (started) return;
  started = true;
  logger.info("in-memory queue started", { queue: QUEUE_SUMMARIZE });
}

export async function enqueueSummarizeMeeting(meetingId) {
  if (!started) throw new Error("Queue not initialized");
  const job = { id: nextId(), name: QUEUE_SUMMARIZE, data: { meetingId } };
  q.push(job);
  logger.debug("job enqueued", { meetingId, jobId: job.id });
  setImmediate(processNext);
  return job.id;
}
