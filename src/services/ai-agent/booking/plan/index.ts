import { BookingPlanEngine } from "./engine";
import type { BookingPlanResponse } from "./types";
export { confirmBookingPlan } from "./confirm";
import { APP_CONFIG } from "@/lib/constants/app";

const engine = new BookingPlanEngine({
  maxBookAheadDays: APP_CONFIG.maxAdvanceBookingDays,
  aiBaseURL: (process.env.AI_BASE_URL || "http://localhost:11434").replace(/\/+$/, ""),
  aiModel: process.env.AI_MODEL_CHAT || "qwen2.5:7b",
});

export async function runBookingPlan(input: {
  activeUniversityId: number;
  studentId: number;
  body: any;
}): Promise<BookingPlanResponse> {
  return engine.run(input);
}
