// src/features/head-consultant/bookings/components/modals/ProblemDetailsModal.tsx
"use client";

import { Modal } from "@/components/ui/Modal";
import type { AdminBookingRow } from "../../types";

export function ProblemDetailsModal({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: AdminBookingRow | null;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="รายละเอียดปัญหา" size="lg">
      {!booking ? (
        <div className="text-sm text-gray-500">ยังไม่ได้เลือกรายการ</div>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="font-medium text-gray-800">
              {booking.problemType ?? "ไม่ระบุประเภท"}
            </div>
            <div className="mt-1 text-gray-600">
              code: <span className="font-mono">{booking.problemCategoryCode ?? "-"}</span>
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="text-xs font-medium text-gray-500">คำอธิบาย</div>
            <div className="mt-2 whitespace-pre-wrap text-gray-800">
              {booking.problemDescription?.trim() ? booking.problemDescription : "—"}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
