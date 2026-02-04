// src/features/consultant-my-jobs/filters/defs.ts
import type { FilterDef } from "@/components/filters/types";

export type ConsultantJobStatusFilter = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type ConsultantMyJobsFilters = {
  date: string; // Y-M-D
  status: ConsultantJobStatusFilter;
  search?: string; // ค้นหาชื่อ/หมวด/รายละเอียด
};

export const CONSULTANT_MY_JOBS_FILTER_DEFS: FilterDef<ConsultantMyJobsFilters>[] = [
  {
    key: "status",
    label: "สถานะ",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "ALL" },
      { label: "รอดำเนินการ", value: "PENDING" },
      { label: "กำลังคุย", value: "IN_PROGRESS" },
      { label: "เสร็จสิ้น", value: "COMPLETED" },
      { label: "ยกเลิก", value: "CANCELLED" },
    ],
  },
];
