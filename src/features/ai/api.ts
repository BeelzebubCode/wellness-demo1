// src/features/ai/api.ts
export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export type AiChatResponse = {
  reply: string;
  blocked?: boolean;

  // agent booking extras (optional)
  plan?: any;
  candidates?: any[];
  suggested?: any;
  confirmToken?: string;

  // debug (optional)
  debug?: any;
  detail?: any;
};

async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include", // ✅ สำคัญ: ให้ cookie (tenant/auth) ติดไป
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });

  // route ของนายส่วนใหญ่คืน 200 เสมอ
  const data = (await res.json().catch(() => ({}))) as T;
  return data;
}

export const aiApi = {
  async chat(endpoint: string, input: { messages?: ChatMsg[]; message?: string }) {
    return postJson<AiChatResponse>(endpoint, input);
  },

  async bookingConfirm(input: { confirmToken: string }) {
    return postJson<AiChatResponse>("/api/v2/ai/agent/booking/confirm", input);
  },
};
