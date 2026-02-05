// src/components/head-consultant/borrow-requests/BorrowRequestDetailPanel.tsx

"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { BorrowRequestDetail } from "@/features/borrow-requests/types";

type Status = BorrowRequestDetail["borrowRequestStatus"];

function tone(status: Status) {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700";
    case "SUBMITTED":
      return "bg-sky-100 text-sky-700";
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    case "ASSIGNED":
      return "bg-violet-100 text-violet-700";
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function statusLabel(status: Status) {
  switch (status) {
    case "DRAFT":
      return "ร่าง";
    case "SUBMITTED":
      return "ส่งแล้ว";
    case "APPROVED":
      return "อนุมัติ";
    case "REJECTED":
      return "ไม่อนุมัติ";
    case "ASSIGNED":
      return "มอบหมายแล้ว";
    case "COMPLETED":
      return "เสร็จสิ้น";
    case "CANCELLED":
      return "ยกเลิก";
    default:
      return status;
  }
}

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("th-TH", { year: "numeric", month: "short", day: "2-digit" });
}

type Props = {
  data: BorrowRequestDetail;
  loading?: boolean;
  onEdit?: () => void;
  onSubmit?: () => Promise<void> | void;
  onCancel?: () => Promise<void> | void;
};

export function BorrowRequestDetailPanel({
  data,
  onEdit,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const canEdit = data.borrowRequestStatus === "DRAFT";
  const canSubmit = data.borrowRequestStatus === "DRAFT";
  const canCancel =
    data.borrowRequestStatus === "DRAFT" ||
    data.borrowRequestStatus === "SUBMITTED";

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-800">
            {data.borrowRequestTitle || "(ไม่มีหัวข้อ)"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ต้องการ {data.borrowNeededCount} คน
          </div>
        </div>

        <Badge className={tone(data.borrowRequestStatus)}>
          {statusLabel(data.borrowRequestStatus)}
        </Badge>
      </div>

      {/* Reason / Detail */}
      <div className="text-sm text-slate-600 whitespace-pre-wrap">
        {data.borrowRequestReason || "-"}
      </div>

      {data.borrowRequestDetail ? (
        <div className="text-sm text-slate-600 whitespace-pre-wrap">
          {data.borrowRequestDetail}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        {canEdit && onEdit ? (
          <Button
            variant="outline"
            disabled={loading}
            onClick={onEdit}
          >
            แก้ไข
          </Button>
        ) : null}

        {canSubmit && onSubmit ? (
          <Button
            disabled={loading}
            onClick={async () => {
              const ok = confirm("ยืนยันส่งคำขอ?");
              if (!ok) return;
              await onSubmit();
            }}
          >
            ส่งคำขอ
          </Button>
        ) : null}

        {canCancel && onCancel ? (
          <Button
            variant="danger"
            disabled={loading}
            onClick={async () => {
              const ok = confirm("ยืนยันยกเลิกคำขอ?");
              if (!ok) return;
              await onCancel();
            }}
          >
            ยกเลิก
          </Button>
        ) : null}
      </div>

      {/* Assignments
      <div className="pt-2 border-t border-slate-100">
        <div className="text-sm font-semibold mb-2">รายการที่ถูก Assign</div>
        {data.assignments?.length ? (
          <div className="space-y-2">
            {data.assignments.map((a) => (
              <div key={a.borrowAssignmentId} className="border rounded-xl p-3 text-sm">
                {a.consultantName ?? `consultantId: ${a.consultantId}`}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">ยังไม่มีการ Assign</div>
        )}
      </div> */}
    </Card>
  );
}
