// src/features/head-consultant/bookings/components/modals/AssignBookingModal.tsx
"use client";

import { useMemo, useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { AdminBookingRow, AssigneeOption } from "../../types";

export function AssignBookingModal({
  open,
  onOpenChange,
  booking,
  assignees,
  isLoadingAssignees,
  isSaving,
  onConfirmAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  booking: AdminBookingRow | null;

  assignees: AssigneeOption[];
  isLoadingAssignees?: boolean;

  isSaving?: boolean;
  onConfirmAssign: (
    bookingId: number,
    consultantId: number,
  ) => Promise<void> | void;
}) {
  const [consultantId, setConsultantId] = useState<number | "">("");

  const consultantOptions = useMemo(
    () =>
      assignees.map((a) => ({
        value: String(a.id),
        label: a.name,
      })),
    [assignees],
  );

  const canSubmit =
    !!booking &&
    Number.isFinite(Number(consultantId)) &&
    Number(consultantId) > 0 &&
    !isSaving;

  // console.log("assignees:", assignees.slice(0, 5));
  // console.log("options:", consultantOptions.slice(0, 5));
  // console.log("selected consultantId state:", consultantId);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Assign ที่ปรึกษา"
      size="md"
    >
      {!booking ? (
        <div className="text-sm text-gray-500">ยังไม่ได้เลือกรายการ</div>
      ) : (
        <div className="space-y-4">
          <div className={cn("rounded-2xl border bg-gray-50 p-3 text-sm")}>
            <div className="font-medium text-gray-800">
              {booking.student?.name ?? booking.student?.username ?? "นิสิต"}
            </div>

            <div className="mt-1 text-gray-600">
              booking_id: <span className="font-mono">{booking.id}</span> /
              status: <span className="font-mono">{booking.status}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">
              เลือก Consultant
            </div>

            {isLoadingAssignees ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner /> กำลังโหลดรายชื่อ...
              </div>
            ) : (
              <Select
                value={consultantId === "" ? "" : String(consultantId)}
                onValueChange={(v) => setConsultantId(v ? Number(v) : "")}
                options={[
                  { value: "", label: "-- เลือก --" },
                  ...consultantOptions,
                ]}
              />
            )}

            <div className="text-xs text-gray-500">
              ✅ เมื่อกด Assign จะส่ง <b>bookingId</b> และ <b>consultantId</b>{" "}
              ไป API
            </div>
          </div>

          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              ยกเลิก
            </Button>

            <Button
              disabled={!canSubmit}
              leftIcon={isSaving ? <Spinner /> : undefined}
              onClick={async () => {
                if (!booking) return;
                const cid = Number(consultantId);
                if (!Number.isFinite(cid) || cid <= 0) return;

                await onConfirmAssign(booking.id, cid);
                onOpenChange(false);
              }}
            >
              Assign
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
