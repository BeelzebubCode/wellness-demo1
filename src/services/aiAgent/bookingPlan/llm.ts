// src/services/aiAgent/bookingPlan/llm.ts
import type { ChatMsg } from "./types";

export async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

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

export async function callChatLLM(args: {
  baseURL: string;
  model: string;
  system: ChatMsg;
  messages: ChatMsg[];
  timeoutMs?: number;
}) {
  const { baseURL, model, system, messages, timeoutMs = 20000 } = args;

  return fetchWithTimeout(
    `${baseURL.replace(/\/+$/, "")}/api/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [system, ...messages],
        options: { temperature: 0.2 },
      }),
    },
    timeoutMs
  );
}
