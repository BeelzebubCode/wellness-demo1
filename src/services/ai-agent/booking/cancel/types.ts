// src/services/aiAgent/booking/cancel/types.ts
import type { AgentQuestion } from "@/services/ai-agent/core";

export type CancelDraft = {
  intent?: "CANCEL";
  reason: string | null;
};

export type BookingCancelResponse = {
  reply: string;

  state?: CancelDraft;

  missingFields?: string[];
  questions?: AgentQuestion[];

  confirmToken?: string | null;

  debug?: any;
};
