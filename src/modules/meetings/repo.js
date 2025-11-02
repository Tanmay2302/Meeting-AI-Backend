import { db } from "../../db/client.js";
import { meetings } from "../../db/schema.js";
import { sql, eq, lt, desc } from "drizzle-orm";

export async function insertMeeting({
  title,
  transcript,
  status = "ready",
  summary = null,
  actionItems = null,
}) {
  const [row] = await db
    .insert(meetings)
    .values({
      title,
      transcript,
      status,
      summary,
      actionItems,
    })
    .returning();
  return row;
}

export async function semanticSearchMeetings({ queryVector, limit = 10 }) {
  // queryVector is number[]; we’ll use the same literal builder
  const literal = `[${queryVector.join(",")}]`;
  const res = await db.execute(sql`
    SELECT m.id, m.title, m.summary, me.embedding_vec
    FROM meeting_embeddings me
    JOIN meetings m ON m.id = me.meeting_id
    WHERE me.embedding_vec IS NOT NULL
    ORDER BY me.embedding_vec <-> ${sql.raw(`'${literal}'::vector`)}
    LIMIT ${limit}
  `);
  return res.rows || [];
}

export async function updateMeetingResult(
  id,
  { summary, actionItems, status }
) {
  const [row] = await db
    .update(meetings)
    .set({ summary, actionItems, status })
    .where(eq(meetings.id, id))
    .returning();
  return row;
}

export async function getMeetingById(id) {
  const rows = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function listMeetings({ limit = 20, cursor }) {
  // simple keyset pagination by id
  const where = cursor ? lt(meetings.id, cursor) : undefined;
  const rows = await db
    .select()
    .from(meetings)
    .where(where)
    .orderBy(desc(meetings.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor };
}
