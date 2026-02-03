// src/features/booking/types.ts

// ✅ เลี่ยง underscore ใน FE: ใช้ camelCase
export type ServiceMode = "ONSITE" | "ONLINE";
export type OnlineChannel = "LINE_CALL" | "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "PHONE" | "OTHER";

// ถ้า backend ส่ง service list ต่อ slot (อนาคต)
export type TimeSlotService = {
  id: number;
  mode: ServiceMode;
  onlineChannel?: OnlineChannel | null;
  title?: string | null; // เช่น "Online: LINE Call"
};

// ให้เข้ากับของเดิมที่นายมีอยู่
export type TimeSlot = {
  time_slot_id: number;
  university_id: number;
  time_slot_start_datetime: string;
  time_slot_end_datetime: string;
  time_slot_status: "OPEN" | "CLOSED" | "CANCELLED" | "FULL";

  // optional: ถ้าจะรองรับ service ต่อ slot
  services?: TimeSlotService[];
};

// ===== Booking payload ที่ส่งไป API =====
export type BookingPayload = {
  timeSlotId: number;
  problemCategoryId: number;
  bookingDetailText?: string | null;

  // ✅ ส่วนที่เพิ่ม: เลือก ONLINE/ONSITE ตอนกดเลือก
  serviceMode: ServiceMode;
  onlineChannel?: OnlineChannel | null;
  timeSlotServiceId?: number | null;

  // ✅ consent (ถ้ายังไม่ทำจริง ก็ส่งแค่ boolean ก่อน)
  consentChecked?: boolean;
};

// response แบบกันพัง
export type CreateBookingResponse =
  | { success: true; bookingId: number; universityId: number }
  | { success: false; error?: string };

// ===== My appointments =====
export type MyAppointment = {
  bookingId: number;
  universityId: number;
  status: string;
  startAt: string;
  endAt: string;
  serviceMode: ServiceMode;
  onlineChannel?: OnlineChannel | null;
  problemCategoryName?: string | null;
};

export type MyAppointmentsResponse =
  | { success: true; items: MyAppointment[] }
  | { success: false; error?: string };

// ===== form state =====
export type BookingFormValues = {
  problemCategoryId: number | null;
  problemDescription: string;
};
