// src/services/aiAgent/booking/cancel/types.ts
import type { AgentQuestion } from "@/services/aiAgent/core";

export type CancelDraft = {
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
