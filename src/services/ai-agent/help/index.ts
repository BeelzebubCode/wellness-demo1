// src/services/aiAgent/help/index.ts
import { HelpEngine } from "./engine";
import type { ChatMsg } from "../core/types";

const engine = new HelpEngine({
  aiBaseURL: (process.env.AI_BASE_URL || "http://localhost:11434").replace(/\/+$/, ""),
  aiModel: process.env.AI_MODEL_CHAT || "qwen2.5:7b",
  timeoutMs: 20000,
});

export async function runHelpChat(input: {
  tenantCode?: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
}) {
  const all: ChatMsg[] = (input.messages ?? []).map((m) => ({
    role: m.role,
    content: String(m.content ?? ""),
  }));

  const lastUser = [...all].reverse().find((m) => m.role === "user");
  const question = (lastUser?.content ?? "").trim();

  // history: ตัด system ออก + ตัด user ล่าสุดออก
  const lastUserIdx = lastUser ? all.lastIndexOf(lastUser) : all.length;
  const history = all.filter((m) => m.role !== "system").slice(0, lastUserIdx);

  return engine.run({
    tenantCode: input.tenantCode ?? "UNKNOWN",
    question,
    messages: history,
    role: null,
    universityId: null,
  });
}
