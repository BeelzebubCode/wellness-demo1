// src/services/aiAgent/booking/cancel/index.ts
import { BookingCancelEngine } from "./engine";
import type { BookingCancelResponse } from "./types";

const engine = new BookingCancelEngine({
  // เผื่ออนาคต: config อื่น ๆ
});

export async function runBookingCancel(input: {
  activeUniversityId: number;
  studentId: number;
  body: any;
}): Promise<BookingCancelResponse> {
  return engine.run(input);
}
