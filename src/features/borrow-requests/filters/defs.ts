import type { FilterDef } from "@/components/filters/types";
import type { BorrowRequestStatus } from "../types";

export type BorrowRequestsFilters = {
  status: BorrowRequestStatus | "ALL";
  q?: string; // search
};

export const BORROW_REQUESTS_FILTER_DEFS: FilterDef<BorrowRequestsFilters>[] = [
  {
    key: "status",
    label: "สถานะ",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "ALL" },
      { label: "Draft", value: "DRAFT" },
      { label: "Submitted", value: "SUBMITTED" },
      { label: "Approved", value: "APPROVED" },
      { label: "Rejected", value: "REJECTED" },
      { label: "Assigned", value: "ASSIGNED" },
      { label: "Completed", value: "COMPLETED" },
      { label: "Cancelled", value: "CANCELLED" },
    ],
  },
];
