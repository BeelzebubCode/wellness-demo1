// src/features/consultant/my-jobs/types.ts

export type BookingStatusUI = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

/** ของจริงจาก API (/api/v2/bookings/my) */
export type MyBookingApiRow = {
  id: number;
  status: string; // prisma booking_status
  problemType: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  date: string | null;      // "YYYY-MM-DD"
  startTime: string | null; // "HH:mm"
  endTime: string | null;   // "HH:mm"

  studentName?: string | null;
  bookingDetailText?: string | null;

  /** ✅ เพิ่ม: โหมดบริการ */
  serviceMode?: "ONSITE" | "ONLINE" | string | null;

  /** ✅ เพิ่ม: ช่องทางออนไลน์ (ถ้ามีแล้ว) */
  onlineChannelUrl?: string | null;
  onlineChannelNote?: string | null;

  universityName?: string | null;
  universityCode?: string | null;
};

export type Job = {
  id: number;
  timeRange: string;
  status: BookingStatusUI;
  userName: string;
  category: string;

  detail: string;
  bookingDetailText?: string | null;

  /** ✅ เพิ่ม: online */
  serviceMode?: "ONSITE" | "ONLINE" | string | null;
  onlineChannelUrl?: string | null;
  onlineChannelNote?: string | null;

  universityName?: string | null;
  universityCode?: string | null;

  raw?: {
    date?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
};

export type OutcomeDraft = {
  consultantNote: string;
  nextStep: string;
  riskLevel: number | null;
};

export type OnlineChannelDraft = {
  url: string;
  note: string;
};
