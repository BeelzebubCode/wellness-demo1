// src/shared/constants/booking-status.ts
import type { BookingStatus } from "@/shared/types/booking";
import type { LucideIcon } from "lucide-react";
import {
  Clock,
  UserCheck,
  PlayCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";

export type BookingStatusConfig = {
  label: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  borderColor: string;
};

export const BOOKING_STATUS: Record<BookingStatus, BookingStatusConfig> = {
  PENDING_ASSIGNMENT: {
    label: "รอจัดสรรผู้ให้คำปรึกษา",
    icon: Clock,
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
  },
  ASSIGNED: {
    label: "มอบหมายแล้ว",
    icon: UserCheck,
    bgColor: "bg-sky-50",
    textColor: "text-sky-700",
    borderColor: "border-sky-200",
  },
  IN_PROGRESS: {
    label: "กำลังให้คำปรึกษา",
    icon: PlayCircle,
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    icon: CheckCircle2,
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  CANCELLED: {
    label: "ยกเลิก",
    icon: XCircle,
    bgColor: "bg-rose-50",
    textColor: "text-rose-700",
    borderColor: "border-rose-200",
  },
};

export const BOOKING_STATUS_FALLBACK: BookingStatusConfig = {
  label: "ไม่ทราบสถานะ",
  icon: HelpCircle,
  bgColor: "bg-gray-50",
  textColor: "text-gray-700",
  borderColor: "border-gray-200",
};

// ✅ แปลง status ที่ backend ส่งมาให้เป็น BookingStatus หรือ UNKNOWN
export function normalizeBookingStatus(input: unknown): BookingStatus | "UNKNOWN" {
  const s = String(input ?? "").trim().toUpperCase();
  if (
    s === "PENDING_ASSIGNMENT" ||
    s === "ASSIGNED" ||
    s === "IN_PROGRESS" ||
    s === "COMPLETED" ||
    s === "CANCELLED"
  ) return s;
  return "UNKNOWN";
}
