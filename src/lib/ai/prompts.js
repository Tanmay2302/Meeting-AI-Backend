export const SUMMARIZE_PROMPT = ({ title, transcript }) => `
You summarize meeting transcripts for busy teams.

Title: ${title}
Transcript:
"""
${transcript}
"""

Instructions:
1) Provide a concise 2–3 sentence summary (decisions + key context).
2) Extract 3–7 actionable items. Include owner/due date if explicitly mentioned.

Return ONLY valid JSON:
{
  "summary": "<2-3 sentence summary>",
  "action_items": [
    { "text": "...", "owner": "optional", "due": "optional ISO8601" }
  ]
}
`;
