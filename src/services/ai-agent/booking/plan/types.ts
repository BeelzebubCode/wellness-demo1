// src/services/aiAgent/booking/plan/types.ts
import type { AgentQuestion } from "@/services/ai-agent/core";

export type PlanLLM = {
  intent?: "BOOK";
  date: string | null;
  timeRange: string | null; // "AUTO" | "HH:mm-HH:mm"
  problemCategoryCode: string | null;
  detailText: string | null;
  serviceMode?: string | null;         // "ONLINE" | "ONSITE"
  onlineChannelCode?: string | null;   // "ZOOM" | "LINE" | "MEET"
};

export type SlotCandidate = {
  timeSlotId: number;
  start: string; // ISO
  end: string;   // ISO
  remaining: number;
  ok: boolean;
};

export type BookingPlanState = PlanLLM & {
  // เผื่ออนาคต (debug/trace)
};

export type BookingPlanResponse = {
  reply: string;
  state?: BookingPlanState;
  candidates?: SlotCandidate[];
  suggested?: SlotCandidate | null;

  // UI support
  categories?: Array<{ id: number; code: string; name: string }>;
  channels?: Array<{ code: string; name: string }>;

  missingFields?: string[];
  questions?: AgentQuestion[];

  confirmToken?: string | null;
  debug?: any;
};
