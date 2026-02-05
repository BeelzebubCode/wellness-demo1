// src/components/head-consultant/borrow-requests/BorrowRequestListCard.tsx
"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { BorrowRequest } from "@/features/borrow-requests/types";
import { Users, Calendar, Clock, ChevronRight, FileText } from "lucide-react";

type Status = BorrowRequest["borrowRequestStatus"];

// ================================
// STATUS UI
// ================================
function tone(status: Status) {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "SUBMITTED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "ASSIGNED":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "COMPLETED":
      return "bg-green-50 text-green-700 border-green-200";
    case "CANCELLED":
      return "bg-slate-50 text-slate-500 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function statusLabel(status: Status) {
  switch (status) {
    case "DRAFT":
      return "ร่าง";
    case "SUBMITTED":
      return "ส่งคำขอแล้ว";
    case "APPROVED":
      return "อนุมัติแล้ว";
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
    day: "numeric",
  });
}

function formatDateTime(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  // const submittedAt = formatDateTime(item.borrowSubmittedAt);

  return (
    <div
      onClick={() => onView(item.borrowRequestId)}
      className="group relative flex flex-col sm:flex-row gap-6 bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4 mb-2">
          <Badge
            variant="outline"
            className={`text-xs px-2.5 py-0.5 rounded-full border ${tone(
              item.borrowRequestStatus
            )}`}
          >
            {statusLabel(item.borrowRequestStatus)}
          </Badge>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            สร้างเมื่อ {createdAt}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2 truncate group-hover:text-primary-700 transition-colors">
          {item.borrowRequestTitle || "(ไม่มีหัวข้อ)"}
        </h3>

        <div className="flex items-start gap-2 mb-4">
          <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-600 line-clamp-2">
            {item.borrowRequestReason || "-"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Users className="w-4 h-4 text-slate-600" />
            </div>
            <span className="font-medium">{item.borrowNeededCount} คน</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Calendar className="w-4 h-4 text-slate-600" />
            </div>
            <span className="font-medium">
              {(item.borrowNeededFrom &&
                formatDate(item.borrowNeededFrom as any)) ||
                "-"}{" "}
              -{" "}
              {(item.borrowNeededTo &&
                formatDate(item.borrowNeededTo as any)) ||
                "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end sm:justify-center pl-0 sm:pl-6 sm:border-l border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50"
        >
          ดูรายละเอียด
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
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
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-300 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <FileText className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          ยังไม่มีรายการคำขอ
        </h3>
        <p className="text-slate-500 max-w-sm mt-1">
          คุณยังไม่ได้สร้างคำขอยืมตัวที่ปรึกษาจากมหาวิทยาลัยอื่น
          เริ่มสร้างคำขอใหม่ได้เลย
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
