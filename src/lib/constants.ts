// ==========================================
// 📌 App Constants (Clean Version)
// ==========================================

import { Clock, UserCheck, Loader2, CheckCircle, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Home, Info, CalendarPlus } from 'lucide-react';
/* ======================================================
   Booking Status
====================================================== */

export const BOOKING_STATUS = {
  PENDING_ASSIGNMENT: {
    key: "PENDING_ASSIGNMENT",
    label: "รอมอบหมาย",
    icon: Clock,
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
  },
  ASSIGNED: {
    key: "ASSIGNED",
    label: "กำลังดำเนินการ",
    icon: UserCheck,
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
  IN_PROGRESS: {
    key: "IN_PROGRESS",
    label: "กำลังให้คำปรึกษา",
    icon: Loader2,
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  COMPLETED: {
    key: "COMPLETED",
    label: "เสร็จสิ้น",
    icon: CheckCircle,
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  CANCELLED: {
    key: "CANCELLED",
    label: "ยกเลิก",
    icon: XCircle,
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    borderColor: "border-gray-200",
  },
} as const;

/* ======================================================
   Days of Week
====================================================== */
export const DAYS_OF_WEEK = [
  { id: 0, name: "อาทิตย์", short: "อา", en: "Sunday" },
  { id: 1, name: "จันทร์", short: "จ", en: "Monday" },
  { id: 2, name: "อังคาร", short: "อ", en: "Tuesday" },
  { id: 3, name: "พุธ", short: "พ", en: "Wednesday" },
  { id: 4, name: "พฤหัสบดี", short: "พฤ", en: "Thursday" },
  { id: 5, name: "ศุกร์", short: "ศ", en: "Friday" },
  { id: 6, name: "เสาร์", short: "ส", en: "Saturday" },
] as const;

/* ======================================================
   Default Working Hours
====================================================== */
export const DEFAULT_WORKING_HOURS = {
  weekday: { openTime: "08:00", closeTime: "20:00" },
  weekend: { openTime: "08:00", closeTime: "16:00" },
  slotDuration: 60, // minutes
  maxBookingsPerSlot: 1,
} as const;

/* ======================================================
   App Config
====================================================== */
export const APP_CONFIG = {
  name: "NU Wellness Center",
  shortName: "NUW",
  description: "ระบบจองคิวให้คำปรึกษาสุขภาพจิต",
  maxAdvanceBookingDays: 60,
  maxActiveBookingsPerUser: 1,
  lineChannelId: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || "",
  liffId: process.env.NEXT_PUBLIC_LIFF_ID || "",
} as const;

/* ======================================================
   API Routes
====================================================== */
export const API_ROUTES = {
  auth: {
    login: "/api/v1/auth/login",
    verify: "/api/v1/auth/verify",
  },
  bookings: {
    list: "/api/v1/bookings",
    create: "/api/v1/bookings",
    detail: (id: string) => `/api/v1/bookings/${id}`,
    update: (id: string) => `/api/v1/bookings/${id}`,
  },
  slots: {
    list: "/api/v1/slots",
  },
  schedule: {
    config: "/api/v1/schedule",
    overrides: "/api/v1/schedule/overrides",
  },
  consultants: {
    list: "/api/v1/consultants",
    detail: (id: string) => `/api/v1/consultants/${id}`,
  },
  users: {
    create: "/api/v1/users",
  },
} as const;

/* ======================================================
   Navigation
====================================================== */

export type PublicNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  exact?: boolean;
};

/* ----- Public ----- */
export const PUBLIC_NAV = [
  {
    href: '/',
    label: 'หน้าแรก',
    icon: Home,
    exact: true,
  },
  {
    href: '/about',
    label: 'เกี่ยวกับเรา',
    icon: Info,
  },
  {
    href: '/booking',
    label: 'จองคิว',  // ✅ เก็บไว้เป็นทางเข้า booking
    icon: CalendarPlus,
  },

];

/* ----- Admin (NO Dashboard / NO Stats) ----- */
export const ADMIN_NAV = [
  {
    href: "/admin/data-center",
    label: "ศูนย์ข้อมูล",
  },
  {
    href: "/admin/bookings",
    label: "มอบหมายงาน",
  },
  {
    href: "/admin/schedule",
    label: "จัดการตาราง",
  },
  {
    href: "/admin/my-jobs",
    label: "งานของฉัน",
  },
] as const;
