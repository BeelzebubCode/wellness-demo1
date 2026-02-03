"use client";

import { Modal } from "@/components/ui";
import { Button } from "@/components/ui";
import { CheckCircle2 } from "lucide-react";

export function BookingSuccessModal({
  isOpen,
  onClose,
  onViewAppointments,
}: {
  isOpen: boolean;
  onClose: () => void;
  onViewAppointments: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="จองสำเร็จ" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-emerald-900">บันทึกการจองเรียบร้อย</div>
            <div className="text-xs text-emerald-800 mt-1">
              คุณสามารถดูรายละเอียดคิวของคุณได้ที่ “คิวของฉัน”
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" variant="secondary" onClick={onClose}>
            ปิด
          </Button>
          <Button className="flex-1" variant="primary" onClick={onViewAppointments}>
            ไปที่คิวของฉัน
          </Button>
        </div>
      </div>
    </Modal>
  );
}
