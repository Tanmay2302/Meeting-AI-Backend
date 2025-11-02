import { db } from "../../db/client.js";
import { meetings } from "../../db/schema.js";
import { summarizeTranscript, embedTextIfEnabled } from "../ai/provider.js";
import { eq } from "drizzle-orm";
import { logger } from "../logger.js";

export async function summarizeJobHandler(job) {
  const { meetingId } = job?.data || {};
  if (!meetingId) {
    logger.warn("job missing meetingId", { jobId: job?.id });
    return;
  }

  try {
    const [row] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);
    if (!row) throw new Error("meeting not found");

    if (row.status === "ready" && row.summary != null) {
      logger.info("job skipped (already ready)", { meetingId, jobId: job.id });
      return;
    }

    const { summary, action_items } = await summarizeTranscript({
      title: row.title,
      transcript: row.transcript,
    });

    await db
      .update(meetings)
      .set({ summary, actionItems: action_items, status: "ready" })
      .where(eq(meetings.id, meetingId));

    try {
      await embedTextIfEnabled(meetingId, row.transcript);
    } catch (embErr) {
      logger.warn("embedding failed (non-fatal)", {
        meetingId,
        jobId: job.id,
        err: String(embErr),
      });
    }
  } catch (err) {
    try {
      const [cur] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, meetingId))
        .limit(1);
      if (cur && !(cur.status === "ready" && cur.summary != null)) {
        await db
          .update(meetings)
          .set({ status: "failed" })
          .where(eq(meetings.id, meetingId));
      }
    } catch {}
    logger.error("job failed", { meetingId, jobId: job?.id, err: String(err) });
  }
}
