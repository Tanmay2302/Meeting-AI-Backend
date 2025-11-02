import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().min(1),
  transcript: z.string().min(10),
});

export const meetingResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  transcript: z.string(),
  summary: z.string().nullable().optional(),
  action_items: z
    .array(
      z.object({
        text: z.string(),
        owner: z.string().optional(),
        due: z.string().datetime().optional(),
      })
    )
    .nullable()
    .optional(),
  status: z.enum(["processing", "ready", "failed"]),
  created_at: z.string(),
});

export const listQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});
