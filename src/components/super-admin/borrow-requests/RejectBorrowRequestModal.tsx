"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function RejectBorrowRequestModal({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => Promise<void> | void;
  loading?: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Reject Borrow Request">
      <div className="space-y-3">
        <textarea
          className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-primary-200"
          rows={5}
          placeholder="เหตุผลที่ปฏิเสธ..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
          >
            ยืนยัน Reject
          </Button>
        </div>
      </div>
    </Modal>
  );
}
