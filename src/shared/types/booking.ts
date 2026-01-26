// src/shared/types/booking.ts

export type BookingStatus =
  | "PENDING_ASSIGNMENT"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface BookingCore {
  id: number;
  universityId: number;
  status: BookingStatus;
  consultantId: number | null;
  date: string | null;      // "YYYY-MM-DD"
  startTime: string | null; // "HH:mm"
  endTime: string | null;   // "HH:mm"

  createdAt: string; // ISO
  updatedAt?: string; // ISO
}

export interface BookingOutcomeCore {
  note: string | null;
  nextStep?: string | null;
  riskLevel?: number | null;
  recordedAt?: string | null;
}

export interface BookingCancellationCore {
  reason: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
}
