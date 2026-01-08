// src/components/admin/schedule/ScheduleAssignModal.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, LoadingSpinner } from "@/components/ui";
import type { Booking } from "@/types";

type AssigneeOption = { id: number; name: string };

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

export function ScheduleAssignModal({
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

  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setAssignees([]);
    setAssigneeId(null);
    setIsLoading(false);
    setIsSubmitting(false);
    setError(null);
  };

  // โหลดรายชื่อ consultant ตอนเปิด
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    (async () => {
      try {
        setError(null);
        setIsLoading(true);

        const res = await fetch("/api/v1/consultants", {
          cache: "no-store",
          signal: controller.signal,
        });

        const json = await res.json();

        // รองรับหลายรูปแบบ response
        const list = (json?.consultants ?? json?.data ?? json ?? []) as any[];

        const mapped: AssigneeOption[] = list
          .map((c) => {
            const id = Number(c.consultant_id ?? c.id);
            if (!Number.isFinite(id)) return null;

            const first = c.profile?.consultant_first_name ?? c.consultant_first_name ?? "";
            const last = c.profile?.consultant_last_name ?? c.consultant_last_name ?? "";
            const fullName = `${first} ${last}`.trim();

            return {
              id,
              name: c.name ?? (fullName || `Consultant #${id}`),
            };
          })
          .filter(Boolean) as AssigneeOption[];

        setAssignees(mapped);
        setAssigneeId(null);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error(e);
        setError("โหลดรายชื่อผู้ให้คำปรึกษาไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [open]);

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
    if (!assigneeId) return;

    try {
      setError(null);
      setIsSubmitting(true);

      // ✅ ปรับให้ตรงกับระบบของนาย: set consultant + status
      const res = await fetch(`/api/v1/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultantId: assigneeId,
          status: "ASSIGNED",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error ?? "assign failed");
      }

      onSuccess();
      handleClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "แจกงานไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title="แจกงานให้ผู้ให้คำปรึกษา" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-500">
          คิวของ{" "}
          <span className="font-semibold text-gray-800">
            {bookingUserName}
          </span>
        </p>

        <div>
          <label className="block text-xs text-gray-600 mb-1">เลือกผู้ให้คำปรึกษา</label>
          <select
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            value={assigneeId ?? ""}
            onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : null)}
            disabled={isLoading || isSubmitting}
            required
          >
            <option value="">
              {isLoading ? "กำลังโหลด..." : "— เลือกคนที่รับเคสนี้ —"}
            </option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isSubmitting}>
            ยกเลิก
          </Button>

          <Button
            type="submit"
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600"
            disabled={!assigneeId || isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : "ยืนยันการแจกงาน"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ScheduleAssignModal;
