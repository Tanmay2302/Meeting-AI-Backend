// src/modules/meetings/service.js
import { db } from "../../db/client.js";
import { meetings } from "../../db/schema.js";
import {
  summarizeTranscript,
  embedTextIfEnabled,
} from "../../lib/ai/provider.js";
import { enqueueSummarizeMeeting } from "../../lib/queue/queue.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { eq, desc } from "drizzle-orm";

// List meetings (latest first)
export async function listMeetings({ limit = 20 } = {}) {
  const rows = await db
    .select()
    .from(meetings)
    .orderBy(desc(meetings.createdAt))
    .limit(limit);
  return { items: rows, nextCursor: null };
}

// Get one meeting; optional read-through fallback with ?auto=1
export async function getMeeting(id, { auto = false } = {}) {
  const rows = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, id))
    .limit(1);

  const row = rows[0] || null;
  if (!row) return null;

  // Read-through fallback: compute now if still processing or empty
  if (auto && (row.status === "processing" || row.summary == null)) {
    logger.info("auto-summarize fallback triggered", { meetingId: id });

    const { summary, action_items } = await summarizeTranscript({
      title: row.title,
      transcript: row.transcript,
    });

    await db
      .update(meetings)
      .set({ summary, actionItems: action_items, status: "ready" })
      .where(eq(meetings.id, id));

    await embedTextIfEnabled(id, row.transcript);

    const [updated] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, id))
      .limit(1);

    logger.info("auto-summarize completed", { meetingId: id });
    return updated || row;
  }

  return row;
}

// Create meeting (async if ENABLE_JOBS=true, else sync)
export async function createMeeting({ title, transcript }) {
  const [created] = await db
    .insert(meetings)
    .values({
      title,
      transcript,
      status: env.ENABLE_JOBS ? "processing" : "ready",
    })
    .returning();

  // Sync path (jobs disabled)
  if (!env.ENABLE_JOBS) {
    const { summary, action_items } = await summarizeTranscript({
      title,
      transcript,
    });

    await db
      .update(meetings)
      .set({ summary, actionItems: action_items, status: "ready" })
      .where(eq(meetings.id, created.id));

    await embedTextIfEnabled(created.id, transcript);

    const updated = await getMeeting(created.id);
    return { meeting: updated, processing: false };
  }

  // Async path (BullMQ)
  try {
    const jobId = await enqueueSummarizeMeeting(created.id);
    logger.debug("job enqueued (service)", { meetingId: created.id, jobId });

    return {
      meeting: {
        ...created,
        summary: null,
        action_items: null,
        status: "processing",
      },
      processing: true,
    };
  } catch (err) {
    // Safety fallback if queue is unavailable
    logger.warn("enqueue failed, falling back to sync", { err: String(err) });

    const { summary, action_items } = await summarizeTranscript({
      title,
      transcript,
    });

    await db
      .update(meetings)
      .set({ summary, actionItems: action_items, status: "ready" })
      .where(eq(meetings.id, created.id));

    await embedTextIfEnabled(created.id, transcript);

    const updated = await getMeeting(created.id);
    return { meeting: updated, processing: false };
  }
}

// Manual force summarize (always compute now)
export async function forceSummarize(meetingId) {
  const rows = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const { summary, action_items } = await summarizeTranscript({
    title: row.title,
    transcript: row.transcript,
  });

  await db
    .update(meetings)
    .set({ summary, actionItems: action_items, status: "ready" })
    .where(eq(meetings.id, meetingId));

  await embedTextIfEnabled(meetingId, row.transcript);

  const [updated] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  logger.info("force summarize completed", { meetingId });
  return updated || row;
}
