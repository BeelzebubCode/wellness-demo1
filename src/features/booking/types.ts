// src/features/booking/types.ts

// ==============================
// re-export shared types (กันพังของเก่าที่ import จาก features)
// ==============================
export type { ServiceMode, OnlineChannel } from "@/shared/types/service";
export type { TimeSlotCore } from "@/shared/types/timeSlot";
export type {
  BookingStatus,
  BookingCore,
  BookingOutcomeCore,
  BookingCancellationCore,
} from "@/shared/types/booking";

// ✅ local imports (ใช้ทำ type ในไฟล์นี้)
import type { ServiceMode, OnlineChannel } from "@/shared/types/service";
import type { TimeSlotCore } from "@/shared/types/timeSlot";
import type { BookingStatus } from "@/shared/types/booking";

// ==============================
// Form state
// ==============================
export type BookingFormValues = {
  problemCategoryId: number | null;
  problemDescription: string;
};

// ==============================
// Payload: create booking
// ==============================
export type BookingPayload = {
  timeSlotId: number;
  problemCategoryId: number;

  bookingDetailText?: string | null;

  serviceMode: ServiceMode;
  onlineChannel?: OnlineChannel | null;

  consentChecked?: boolean;
  consentSignatureDataUrl?: string | null;

  // compat (โค้ดเก่า)
  detailText?: string | null;
};

export type CreateBookingResponse =
  | { success: true; bookingId: number; universityId?: number }
  | { success: false; error: string };

// ==============================
// DB ใหม่: BookingSession
// ==============================
export type BookingSessionDto = {
  mode: ServiceMode;
  onlineChannel?: OnlineChannel | null;

  joinUrl?: string | null;
  phoneNumber?: string | null;
  locationText?: string | null;
  extraDetail?: string | null;

  providedAt?: string | null;
  providedByName?: string | null;
};

// ==============================
// DB ใหม่: Booking สำหรับหน้า booking / my-appointments
// ==============================
export type MyBookingDto = {
  // 🔑 composite key
  bookingId: number;
  universityId: number;

  status: BookingStatus;

  serviceMode: ServiceMode;
  onlineChannel?: OnlineChannel | null;

  // ⏰ จาก time_slot (timestamptz)
  startAt: string; // ISO
  endAt: string; // ISO

  problemCategoryNameTh?: string | null;

  // consultant (optional)
  consultantId?: number | null;
  consultantName?: string | null;
  consultantOrg?: string | null;

  // ONLINE only
  session?: BookingSessionDto | null;
};

// ==============================
// API Response: /api/v2/bookings/my
// ==============================
export type MyAppointmentsResponse =
  | { 
      success: true; 
      universityId?: number; 
      items: MyBookingDto[]; 
      total: number;
      page: number;
      limit: number;
    }
  | { success: false; error: string };

// ==============================
// Action inputs
// ==============================
export type CancelBookingInput = {
  bookingId: number;
  universityId: number;
  reason: string;
};

// ==============================
// Compat aliases (TimeSlot) — กันไฟล์เก่าพัง
// ==============================
export type TimeSlot = TimeSlotCore;
export type BookingTimeSlot = TimeSlotCore;
