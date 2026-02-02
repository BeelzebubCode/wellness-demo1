// src/features/ai/api/client.ts

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export type AgentQuestion = {
  field: string;
  text: string;
  options?: { value: any; label: string; code?: string }[];
};

export type AiChatResponse = {
  reply: string;
  blocked?: boolean;

  // รองรับทั้งของเก่า/ใหม่ (plan หรือ state)
  plan?: any;
  state?: any;

  candidates?: any[];
  suggested?: any;

  missingFields?: string[];
  questions?: AgentQuestion[];

  confirmToken?: string;

  success?: boolean; // confirm result
  error?: string;

  debug?: any;
  detail?: any;
};

export async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include", // ✅ ให้ tenant/auth cookie ติดไป
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });

  return (await res.json().catch(() => ({}))) as T;
}
