"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { BorrowRequest } from "@/features/borrow-requests/types";

function tone(status: BorrowRequest["borrowRequestStatus"]) {
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

function BorrowRequestCard({
  item,
  onView,
  onSubmit,
  onCancel,
}: {
  item: BorrowRequest;
  onView: (id: number) => void;
  onSubmit?: (id: number) => void;
  onCancel?: (id: number) => void;
}) {
  const canSubmit = item.borrowRequestStatus === "DRAFT";
  const canCancel =
    item.borrowRequestStatus === "DRAFT" || item.borrowRequestStatus === "SUBMITTED";

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 truncate">
            {item.borrowRequestTitle}
          </div>
          <div className="text-sm text-slate-500 line-clamp-2">
            {item.borrowRequestReason}
          </div>
        </div>

        <Badge className={tone(item.borrowRequestStatus)}>
          {item.borrowRequestStatus}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          ต้องการ {item.borrowNeededCount} คน
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onView(item.borrowRequestId)}>
            ดูรายละเอียด
          </Button>

          <Button disabled={!canSubmit || !onSubmit} onClick={() => onSubmit?.(item.borrowRequestId)}>
            ส่งคำขอ
          </Button>

          <Button
            variant="danger"
            disabled={!canCancel || !onCancel}
            onClick={() => onCancel?.(item.borrowRequestId)}
          >
            ยกเลิก
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function BorrowRequestListCard({
  rows,
  loading,
  onView,
  onSubmit,
  onCancel,
}: {
  rows: BorrowRequest[];
  loading?: boolean;
  onView: (id: number) => void;
  onSubmit?: (id: number) => void;
  onCancel?: (id: number) => void;
}) {
  if (!rows?.length && !loading) {
    return (
      <Card className="p-10 text-center text-slate-500">
        ไม่มีรายการ
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {(rows || []).map((item) => (
        <BorrowRequestCard
          key={item.borrowRequestId}
          item={item}
          onView={onView}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}
