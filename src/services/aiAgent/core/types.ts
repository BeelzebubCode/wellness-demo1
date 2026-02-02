// src/services/aiAgent/core/types.ts

export type ChatRole = "system" | "user" | "assistant";
export type ChatMsg = { role: ChatRole; content: string };

// ใช้ string union ทีหลังได้ ตอนนี้เริ่มแบบ string ก่อนให้ยืดหยุ่น
export type MissingField = string;

export type AgentOption = { value: any; label: string; code?: string };

export type AgentQuestion = {
  field: MissingField;
  text: string;
  options?: AgentOption[];
};

export type AgentContext = {
  activeUniversityId: number;
  studentId: number;

  // เผื่ออนาคต: accountId, role, locale, traceId, requestId, etc.
  role?: string;
  traceId?: string;
};

export type AgentResponse<TState = any> = {
  reply: string;

  // state = draft/plan ของ agent นั้น ๆ (เช่น PlanLLM หรือ CancelDraft)
  state?: TState;

  missingFields?: MissingField[];
  questions?: AgentQuestion[];

  confirmToken?: string | null;

  // เผื่อ UI ในอนาคต (cards/structured output)
  ui?: any;

  // เปิดใช้เฉพาะ dev
  debug?: any;
};
