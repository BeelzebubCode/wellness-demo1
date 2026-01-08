// src/components/admin/schedule/ScheduleRescheduleModal.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, LoadingSpinner } from "@/components/ui";
import type { Booking } from "@/types";

function getBookingId(booking: Booking | null): number | null {
  if (!booking) return null;
  const anyB = booking as any;
  const id = anyB.booking_id ?? anyB.id ?? null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function getBookingUserName(booking: Booking | null): string {
  if (!booking) return "นิสิต";
  const b = booking as any;
  return b.userName ?? b.studentName ?? b.student?.profile?.student_first_name ?? "นิสิต";
}

export function ScheduleRescheduleModal({
  isOpen,
  booking,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const open = isOpen && !!booking;

  const bookingId = useMemo(() => getBookingId(booking), [booking]);
  const bookingUserName = useMemo(() => getBookingUserName(booking), [booking]);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDate("");
    setStartTime("");
    setEndTime("");
    setReason("");
    setIsSubmitting(false);
    setError(null);
  };

  useEffect(() => {
    if (!open || !booking) return;

    const b = booking as any;

    setDate(b.date ?? b.booking_date ?? "");
    setStartTime(b.startTime ?? b.booking_start_time ?? "");
    setEndTime(b.endTime ?? b.booking_end_time ?? "");
    setReason("");
    setError(null);
  }, [open, booking]);

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      setError("หา booking_id ไม่เจอ (ตรวจสอบ type Booking)");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);

      // ✅ ถ้ามีนายมี endpoint เฉพาะ /reschedule ให้เปลี่ยนได้เลย
      const res = await fetch(`/api/v1/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reschedule: { date, startTime, endTime, reason },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error ?? "reschedule failed");
      }

      onSuccess();
      handleClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "เลื่อนนัดไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title="เลื่อนเวลานัด" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-500">
          กำลังเลื่อนคิวของ{" "}
          <span className="font-semibold text-gray-800">{bookingUserName}</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">วันที่ใหม่</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">เวลาเริ่มต้น</label>
            <input
              type="time"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">เวลาสิ้นสุด</label>
            <input
              type="time"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">เหตุผลในการเลื่อนนัด</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="ระบุสาเหตุ เช่น ผู้ให้คำปรึกษาติดภารกิจ / ปรับเวลาให้เหมาะกับนิสิต ฯลฯ"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isSubmitting}>
            ยกเลิก
          </Button>

          <Button
            type="submit"
            size="sm"
            className="bg-amber-500 hover:bg-amber-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : "ยืนยันการเลื่อนนัด"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ScheduleRescheduleModal;
