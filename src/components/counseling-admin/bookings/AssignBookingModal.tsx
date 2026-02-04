// src/components/admin/bookings/AssignBookingModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { cn } from "@/lib/cn";

import type { AdminBookingRow, AssigneeOption } from "@/features/counseling-admin/type";

export interface AssignPayload {
  consultantId: number;
  note?: string;
}

export function AssignBookingModal({
  booking,
  assignees,
  onClose,
  onConfirm,
}: {
  booking: AdminBookingRow | null;
  assignees: AssigneeOption[];
  onClose: () => void;
  onConfirm: (payload: AssignPayload) => void;
}) {
  const [consultantId, setConsultantId] = useState<string>("");
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (booking) {
      setConsultantId("");
      setNote("");
    }
  }, [booking]);

  const canAssign = useMemo(() => {
    if (!booking) return false;
    return booking.status === "PENDING_ASSIGNMENT" && booking.consultantId == null;
  }, [booking]);

  if (!booking) return null;

  return (
    <Modal isOpen={!!booking} onClose={onClose} title="แจกงานให้ผู้ให้คำปรึกษา" size="sm">
      {!canAssign && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          รายการนี้ถูกมอบหมายไปแล้ว หรือสถานะไม่อนุญาตให้แจกงาน
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canAssign) return;

          const idNum = Number(consultantId);
          if (!Number.isFinite(idNum) || !idNum) return;

          onConfirm({ consultantId: idNum, note: note.trim() || undefined });
        }}
        className="space-y-4"
      >
        <p className="text-xs text-gray-500">
          คิวของ <span className="font-semibold text-gray-800">{booking.userName ?? "ไม่ทราบชื่อ"}</span>
        </p>

        <div>
          <label className="block text-xs text-gray-600 mb-1">เลือกผู้ให้คำปรึกษา</label>
          <select
            className={cn(
              "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none",
              "focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white",
              !canAssign && "opacity-60 pointer-events-none",
            )}
            value={consultantId}
            onChange={(e) => setConsultantId(e.target.value)}
            required
            disabled={!canAssign}
          >
            <option value="">— เลือกคนที่รับเคสนี้ —</option>
            {assignees.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className={cn(!canAssign && "opacity-60 pointer-events-none")}>
          <label className="block text-xs text-gray-600 mb-1">โน้ต (ถ้ามี)</label>
          <textarea
            className="w-full min-h-[84px] rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={!canAssign}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            type="submit"
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600"
            disabled={!canAssign || !consultantId}
          >
            ยืนยันการแจกงาน
          </Button>
        </div>
      </form>
    </Modal>
  );
}
