// src/services/aiAgent/booking/cancel/index.ts
import { BookingCancelEngine } from "./engine";
import type { BookingCancelResponse } from "./types";
export { confirmBookingCancel } from "./confirm";

const engine = new BookingCancelEngine({});

export async function runBookingCancel(input: {
  activeUniversityId: number;
  studentId: number;
  body: any;
}): Promise<BookingCancelResponse> {
  return engine.run(input);
}
