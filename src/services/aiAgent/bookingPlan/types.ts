// src/services/aiAgent/bookingPlan/types.ts
export type ChatMsg = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AgentField = "problemCategoryId" | "date" | "timeRange" | "detailText";

export type PlanLLM = {
  date: string | null;
  timeRange: string; // "HH:MM-HH:MM" | "ANY"
  problemCategoryCode: string | null;
  detailText: string | null;
  notes: string | null;
};

export type AgentQuestion = {
  field: AgentField;
  text: string;
  options?: { value: any; label: string; code?: string }[];
};

export type BookingPlanResponse = {
  reply: string;
  plan?: any;
  candidates?: any[];
  suggested?: any;
  confirmToken?: string | null;
  categories?: { id: number; code: string; name: string }[];
  missingFields?: AgentField[];
  questions?: AgentQuestion[];
  debug?: any;
};