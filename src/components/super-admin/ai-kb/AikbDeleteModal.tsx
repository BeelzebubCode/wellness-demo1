// components/super-admin/ai-kb/AikbDeleteModal.tsx

"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { AiKbDoc } from "@/features/ai-kb/types";

export default function AiKbDeleteModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doc: AiKbDoc | null;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}) {
  const { open, onOpenChange, doc, onConfirm, isDeleting } = props;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="ยืนยันการลบเอกสาร"
      description="การลบจะลบทุกเวอร์ชันของเอกสารนี้ด้วย"
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {doc ? (
            <>
              จะลบ <span className="font-mono">{doc.key}</span> ({doc.title})
            </>
          ) : (
            "ยังไม่ได้เลือกเอกสาร"
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={!doc || isDeleting}>
            {isDeleting ? "กำลังลบ..." : "ลบ"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
