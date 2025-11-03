
import { env } from "../../config/env.js";
import { SUMMARIZE_PROMPT } from "./prompts.js";
import { safeParseAIJson } from "./parse.js";
import { db } from "../../db/client.js";
import { meetingEmbeddings } from "../../db/schema.js";
import Groq from "groq-sdk";
import { logger } from "../logger.js";


function assertKey() {
  if (env.AI_PROVIDER !== "mock" && env.AI_PROVIDER !== "groq") {
    throw new Error(`Unsupported AI_PROVIDER: ${env.AI_PROVIDER}`);
  }
  if (env.AI_PROVIDER === "groq" && !env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY missing");
  }
}


const extractJsonBlock = (text) => {
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return null;
  return text.slice(s, e + 1);
};



export async function summarizeTranscript({ title, transcript }) {
  
  if (env.AI_PROVIDER === "mock") {
    const s =
      transcript
        .split(/[.?!]\s/)
        .slice(0, 2)
        .join(". ") || "Discussion held.";
    return {
      summary: `Summary: ${s}. Key decisions captured.`,
      action_items: [{ text: "Share notes" }, { text: "Assign owners" }],
    };
  }

 
  assertKey();
  const prompt = SUMMARIZE_PROMPT({ title, transcript });

  const groq = new Groq({ apiKey: env.GROQ_API_KEY });
  const chat = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const text = chat.choices?.[0]?.message?.content || "{}";

  try {
    return safeParseAIJson(text);
  } catch {
    const block = extractJsonBlock(text);
    if (!block) {
      logger.warn("Groq non-JSON output", { preview: text.slice(0, 160) });
      throw new Error("Groq returned non-JSON output");
    }
    return safeParseAIJson(block);
  }
}


export async function embedTextIfEnabled(meetingId, text) {
  if (!env.ENABLE_EMBEDDINGS) return;

  try {
   
    const vec = Array.from(text.slice(0, 128)).map(
      (c) => (c.charCodeAt(0) % 97) / 97
    );
    const modelName = "mock-embedding";

    await db.insert(meetingEmbeddings).values({
      meetingId,
      model: modelName,
      embedding: vec,
    });

    logger.debug("embedding saved", {
      meetingId,
      dims: vec.length,
      model: modelName,
    });
  } catch (err) {
  
    logger.warn("embedTextIfEnabled failed (non-fatal)", {
      meetingId,
      err: String(err),
    });
  }
}
