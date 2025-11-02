import { z } from "zod";

const ActionItem = z.object({
  text: z.string(),
  owner: z.string().optional(),
  due: z.string().optional(),
});

const ResultSchema = z.object({
  summary: z.string(),
  action_items: z.array(ActionItem).default([]),
});

export function safeParseAIJson(text) {
  // Try to find JSON block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("AI returned no JSON");
  }
  const slice = text.slice(start, end + 1);
  const parsed = JSON.parse(slice);
  return ResultSchema.parse(parsed);
}
