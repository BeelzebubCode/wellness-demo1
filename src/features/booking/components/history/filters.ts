import type { FilterDef } from "@/components/filters/types";

export type BookingHistoryFilters = {
  search?: string;
  status?: "ALL" | "COMPLETED" | "CANCELLED";
  dateFrom?: string; // yyyy-mm-dd
  dateTo?: string;   // yyyy-mm-dd
};

export const BOOKING_HISTORY_FILTER_DEFS: FilterDef<BookingHistoryFilters>[] = [
  {
    key: "status",
    label: "สถานะ",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "ALL" },
      { label: "เสร็จสิ้น", value: "COMPLETED" },
      { label: "ยกเลิก", value: "CANCELLED" },
    ],
  },
  { key: "dateFrom", label: "ตั้งแต่วันที่", type: "date" },
  { key: "dateTo", label: "ถึงวันที่", type: "date" },
];
