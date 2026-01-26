// path: src/components/admin/bookings/ProblemDetailsModal.tsx
"use client";

import { Modal, Button } from "@/components/ui";
import type { AdminBookingRow } from "@/features/counseling-admin-bookings/type";

export function ProblemDetailsModal({
  booking,
  onClose,
}: {
  booking: AdminBookingRow | null;
  onClose: () => void;
}) {
  if (!booking) return null;

  return (
    <Modal isOpen={!!booking} onClose={onClose} title="รายละเอียดปัญหา" size="md">
      <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs text-gray-500 mb-1">ผู้จอง</p>
          <p className="text-sm font-semibold text-gray-900">
            {booking.userName ?? "ไม่ทราบชื่อ"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            LINE ID: {booking.lineUserId ?? "-"} • เวลา {booking.startTime}–{booking.endTime} น.
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">ประเภทปัญหา</p>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-base font-semibold text-gray-900">
              {booking.problemType ?? "-"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">รายละเอียด</p>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {booking.problemDescription ?? "ไม่มีรายละเอียดเพิ่มเติม"}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            ปิด
          </Button>
        </div>
      </div>
    </Modal>
  );
}
