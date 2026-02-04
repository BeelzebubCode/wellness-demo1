// src/features/counseling-admin/bookings/components/modals/RescheduleBookingModal.tsx
"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import type { AdminBookingRow } from "../../types";

export function RescheduleBookingModal({
  open,
  onOpenChange,
  booking,
  isSaving,
  onConfirmReschedule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  booking: AdminBookingRow | null;

  isSaving?: boolean;
  onConfirmReschedule: (bookingId: number, isoDateTime: string) => Promise<void> | void;
}) {
  const [isoDateTime, setIsoDateTime] = useState("");

  const canSubmit = !!booking && isoDateTime.trim().length >= 10 && !isSaving;

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="เลื่อนนัด" size="md">
      {!booking ? (
        <div className="text-sm text-gray-500">ยังไม่ได้เลือกรายการ</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-gray-50 p-3 text-sm">
            booking_id: <span className="font-mono">{booking.id}</span>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">
              วันเวลาใหม่ (ISO / หรืออะไรก็ได้ที่ backend รับ)
            </div>

            <Input
              placeholder="เช่น 2026-02-05T10:30:00+07:00"
              value={isoDateTime}
              onChange={(e) => setIsoDateTime(e.target.value)}
            />

            <div className="text-xs text-gray-500">
              ถ้าอยากให้เป็น picker เดี๋ยวผูกกับ timeslot ได้
            </div>
          </div>

          <ModalFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
              ยกเลิก
            </Button>

            <Button
              disabled={!canSubmit}
              leftIcon={isSaving ? <Spinner /> : undefined}
              onClick={async () => {
                if (!booking) return;
                await onConfirmReschedule(booking.id, isoDateTime.trim());
                onOpenChange(false);
              }}
            >
              ยืนยันเลื่อนนัด
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
