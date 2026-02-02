// src/services/aiAgent/booking/plan/index.ts
import { BookingPlanEngine } from "./engine";
import type { BookingPlanResponse } from "./types";

const engine = new BookingPlanEngine({
  maxBookAheadDays: 7,
  aiBaseURL: (process.env.AI_BASE_URL || "http://localhost:11434").replace(/\/+$/, ""),
  aiModel: process.env.AI_MODEL || "qwen2.5:7b",
});

export async function runBookingPlan(input: {
  activeUniversityId: number;
  studentId: number;
  body: any;
}): Promise<BookingPlanResponse> {
  return engine.run(input);
}
