// src/services/aiAgent/bookingCancel/types.ts
export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export type AgentQuestion = {
  field: "reason";
  text: string;
  options?: { value: any; label: string; code?: string }[];
};

export type CancelPlanResponse = {
  reply: string;
  intent: "CANCEL";
  confirmToken?: string | null;
  missingFields?: string[];
  questions?: AgentQuestion[];
  debug?: any;
};
