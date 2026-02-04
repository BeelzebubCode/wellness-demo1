// src/features/booking/components/my-appointments/CancelBookingModal.tsx

"use client";

import { AlertBox } from "@/components/notification/AlertBox";
import { Button, Modal, ModalFooter } from "@/components/ui";

export function CancelBookingModal({
  open,
  onClose,
  reason,
  onChangeReason,
  error,
  hasSubmitted,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;

  reason: string;
  onChangeReason: (v: string) => void;

  error: string | null;
  hasSubmitted: boolean;

  onConfirm: () => void;
  isLoading?: boolean;
}) {
  return (
    <Modal isOpen={open} onClose={onClose} title="ยืนยันการยกเลิก" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">คุณแน่ใจหรือไม่ที่จะยกเลิกการจองนี้?</p>

        <textarea
          value={reason}
          onChange={(e) => onChangeReason(e.target.value)}
          placeholder="เหตุผล (จำเป็น)"
          rows={3}
          className={`
            w-full p-3 rounded-xl text-sm transition border
            ${error && hasSubmitted
              ? "border-red-400 bg-red-50 focus:ring-red-300"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-300"
            }
            focus:outline-none focus:ring-2
          `}
        />

        {error ? <AlertBox type="error" message={error} /> : null}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          ยกเลิก
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
          ยืนยันยกเลิกการจอง
        </Button>
      </ModalFooter>
    </Modal>
  );
}
