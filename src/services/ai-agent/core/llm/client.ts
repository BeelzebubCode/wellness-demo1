// src/services/aiAgent/core/llm/client.ts
import type { ChatMsg } from "../types";

export async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function callChatLLM(args: {
  baseURL: string;
  model: string;
  system: ChatMsg;
  messages: ChatMsg[];
  timeoutMs?: number;
  temperature?: number;
  tools?: any[];
}) {
  const {
    baseURL,
    model,
    system,
    messages,
    timeoutMs = 20000,
    temperature = 0.2,
    tools,
  } = args;

  const bodyPayload: any = {
    model,
    stream: false,
    messages: [system, ...messages],
    options: { temperature },
  };

  if (tools && tools.length > 0) {
    bodyPayload.tools = tools;
  }

  return fetchWithTimeout(
    `${baseURL.replace(/\/+$/, "")}/api/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    },
    timeoutMs,
  );
}
