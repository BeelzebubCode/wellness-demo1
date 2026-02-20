// src/features/head-consultant-bookings/filters/defs.ts
import type { FilterDef } from "@/components/filters/types";

export type AdminBookingsFilters = {
  date?: string; // ✅ yyyy-mm-dd
  search?: string;
  status?: "ALL" | "PENDING_ASSIGNMENT" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  consultantId?: string;
  problemCategoryId?: string;
  assignmentMethod?: "ALL" | "MANUAL" | "AUTO";
};

export const ADMIN_BOOKINGS_FILTER_DEFS: FilterDef<AdminBookingsFilters>[] = [
  // Date is handled by external picker
  { key: "status", label: "สถานะ", type: "select", options: [
    { label: "ทั้งหมด", value: "ALL" },
    { label: "รอมอบหมาย", value: "PENDING_ASSIGNMENT" },
    { label: "มอบหมายแล้ว", value: "ASSIGNED" },
    { label: "กำลังดำเนินการ", value: "IN_PROGRESS" },
    { label: "เสร็จสิ้น", value: "COMPLETED" },
    { label: "ยกเลิก", value: "CANCELLED" },
  ]},

  { key: "problemCategoryId", label: "ประเภทเรื่อง", type: "select", options: [] },
  { key: "consultantId", label: "ผู้ให้คำปรึกษา", type: "select", options: [] },
  { key: "assignmentMethod", label: "วิธีแจกงาน", type: "select", options: [
    { label: "ทั้งหมด", value: "ALL" },
    { label: "จัดการเอง (Manual)", value: "MANUAL" },
    { label: "แจกงานอัตโนมัติ (Auto)", value: "AUTO" },
  ]},
];
