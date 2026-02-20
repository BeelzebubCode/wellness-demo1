// src/services/aiAgent/core/llm/parse.ts

export function extractJsonFromText(text: string) {
  const t = String(text || "");
  const fenced = t.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const obj = t.match(/\{[\s\S]*\}/);
  if (obj?.[0]) return obj[0].trim();
  return "";
}

export function safeParseJson<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/**
 * บ่อยมาก: response LLM มี { message: { content } }
 */
export function getLLMContent(data: any): string {
  return String(data?.message?.content ?? "").trim();
}
