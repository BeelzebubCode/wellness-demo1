"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import type { Booking } from "@/types";

export interface AssignPayload {
  consultantId: number;
  note?: string;
}

export interface AssigneeOption {
  id: string | number; // consultant_id
  name: string;
}

export function AssignBookingModal({
  booking,
  assignees,
  onClose,
  onConfirm,
}: {
  booking: Booking | null;
  assignees: AssigneeOption[];
  onClose: () => void;
  onConfirm: (payload: AssignPayload) => void;
}) {
  const [consultantId, setConsultantId] = useState<string>("");

  useEffect(() => {
    if (booking) setConsultantId("");
  }, [booking]);

  if (!booking) return null;

  return (
    <Modal
      isOpen={!!booking}
      onClose={onClose}
      title="แจกงานให้ผู้ให้คำปรึกษา"
      size="sm"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const idNum = Number(consultantId);
          if (!Number.isFinite(idNum)) return;
          onConfirm({ consultantId: idNum });
        }}
        className="space-y-4"
      >
        <p className="text-xs text-gray-500">
          คิวของ{" "}
          <span className="font-semibold text-gray-800">
            {booking.userName ?? "ไม่ทราบชื่อ"}
          </span>
        </p>

        <div>
          <label className="block text-xs text-gray-600 mb-1">
            เลือกผู้ให้คำปรึกษา
          </label>

          <select
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            value={consultantId}
            onChange={(e) => setConsultantId(e.target.value)}
            required
          >
            <option value="">— เลือกคนที่รับเคสนี้ —</option>
            {assignees.map((a) => (
              <option key={String(a.id)} value={String(a.id)}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            type="submit"
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600"
            disabled={!consultantId}
          >
            ยืนยันการแจกงาน
          </Button>
        </div>
      </form>
    </Modal>
  );
}
