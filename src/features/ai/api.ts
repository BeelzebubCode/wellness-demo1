// src/features/ai/api.ts
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function sendHelpChat(messages: ChatMessage[]) {
  const r = await fetch("/api/v2/ai/help", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const data = await r.json().catch(() => ({} as any));

  if (!r.ok) {
    const detail = data?.detail ? `\n\n${data.detail}` : "";
    throw new Error((data?.error ?? "Request failed") + detail);
  }

  return data as { reply: string };
}
