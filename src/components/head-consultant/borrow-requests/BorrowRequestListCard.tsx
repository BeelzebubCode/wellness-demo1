// src/components/head-consultant/borrow-requests/BorrowRequestListCard.tsx
"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { BorrowRequest } from "@/features/borrow-requests/types";

type Status = BorrowRequest["borrowRequestStatus"];

// ================================
// STATUS UI
// ================================
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
      return "ส่งคำขอแล้ว";
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

// ================================
// UTIL
// ================================
function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// ================================
// CARD
// ================================
function BorrowRequestCard({
  item,
  onView,
}: {
  item: BorrowRequest;
  onView: (id: number) => void;
}) {
  const createdAt = formatDate(item.borrowRequestCreatedAt);
  const submittedAt = formatDate(item.borrowSubmittedAt);

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 truncate">
            {item.borrowRequestTitle ?? "(ไม่มีหัวข้อ)"}
          </div>

          <div className="text-sm text-slate-500 line-clamp-2">
            {item.borrowRequestReason ?? "-"}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>ต้องการ {item.borrowNeededCount} คน</span>
            {createdAt && <span>สร้าง: {createdAt}</span>}
            {submittedAt && <span>ส่ง: {submittedAt}</span>}
          </div>
        </div>

        <Badge className={tone(item.borrowRequestStatus)}>
          {statusLabel(item.borrowRequestStatus)}
        </Badge>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(item.borrowRequestId)}
        >
          ดูรายละเอียด
        </Button>
      </div>
    </Card>
  );
}

// ================================
// LIST
// ================================
export function BorrowRequestListCard({
  rows,
  loading,
  onView,
}: {
  rows: BorrowRequest[];
  loading?: boolean;
  onView: (id: number) => void;
}) {
  if (!loading && (!rows || rows.length === 0)) {
    return (
      <Card className="p-10 text-center text-slate-500">
        ไม่มีรายการคำขอยืมที่ปรึกษา
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((item) => (
        <BorrowRequestCard
          key={item.borrowRequestId}
          item={item}
          onView={onView}
        />
      ))}
    </div>
  );
}
