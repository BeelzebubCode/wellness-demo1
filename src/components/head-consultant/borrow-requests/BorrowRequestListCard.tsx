// src/components/head-consultant/borrow-requests/BorrowRequestListCard.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { BorrowRequest } from "@/features/borrow-requests/types";
import {
  Users,
  Calendar,
  Clock,
  ChevronRight,
  FileText,
  FilePenLine,
  Send,
  CheckCircle2,
  UserCheck,
  XCircle,
  ArrowRight,
  Inbox,
  PlusCircle,
} from "lucide-react";

type Status = BorrowRequest["borrowRequestStatus"];

/* ─────────── Status Config ─────────── */

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: typeof FileText;
    bg: string;
    text: string;
    border: string;
    dot: string;
    accent: string;
    iconBg: string;
  }
> = {
  DRAFT: {
    label: "ร่าง",
    icon: FilePenLine,
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
    accent: "border-l-slate-400",
    iconBg: "bg-slate-100",
  },
  SUBMITTED: {
    label: "ส่งคำขอแล้ว",
    icon: Send,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    accent: "border-l-blue-500",
    iconBg: "bg-blue-100",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    accent: "border-l-emerald-500",
    iconBg: "bg-emerald-100",
  },
  ASSIGNED: {
    label: "มอบหมายแล้ว",
    icon: UserCheck,
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    dot: "bg-violet-500",
    accent: "border-l-violet-500",
    iconBg: "bg-violet-100",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    icon: CheckCircle2,
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
    accent: "border-l-green-500",
    iconBg: "bg-green-100",
  },
  CANCELLED: {
    label: "ยกเลิก",
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-500",
    border: "border-red-200",
    dot: "bg-red-400",
    accent: "border-l-red-300",
    iconBg: "bg-red-100",
  },
};

function getStatusConfig(status: Status) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status,
      icon: FileText,
      bg: "bg-slate-50",
      text: "text-slate-600",
      border: "border-slate-200",
      dot: "bg-slate-400",
      accent: "border-l-slate-400",
      iconBg: "bg-slate-100",
    }
  );
}

/* ─────────── Date Formatter ─────────── */

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

/* ─────────── Step Progress (Compact) ─────────── */

const STEPS = [
  { key: "DRAFT", label: "สร้าง" },
  { key: "SUBMITTED", label: "ส่ง" },
  { key: "APPROVED", label: "อนุมัติ" },
  { key: "ASSIGNED", label: "มอบหมาย" },
  { key: "COMPLETED", label: "เสร็จ" },
] as const;

const STATUS_ORDER: Record<string, number> = {
  DRAFT: 0,
  SUBMITTED: 1,
  APPROVED: 2,
  ASSIGNED: 3,
  COMPLETED: 4,
  CANCELLED: -1,
};

function CompactStepProgress({ status }: { status: Status }) {
  const currentIdx = STATUS_ORDER[status] ?? -1;

  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-red-500 text-xs font-medium">
        <XCircle className="w-3.5 h-3.5" />
        ยกเลิกแล้ว
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 bg-slate-50/80 rounded-xl px-3 py-2.5 border border-slate-100">
      {STEPS.map((step, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold
                  transition-all duration-300
                  ${isDone
                    ? "bg-primary-600 text-white"
                    : isCurrent
                      ? "bg-primary-100 text-primary-700 ring-1 ring-primary-400 ring-offset-1"
                      : "bg-slate-200 text-slate-400"
                  }
                `}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={`text-[9px] whitespace-nowrap ${isDone
                    ? "text-primary-600 font-medium"
                    : isCurrent
                      ? "text-primary-700 font-semibold"
                      : "text-slate-400"
                  }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-4 sm:w-6 h-0.5 mx-0.5 mb-3 rounded-full transition-all duration-300 ${isDone ? "bg-primary-400" : "bg-slate-200"
                  }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── Card ─────────── */

function BorrowRequestCard({
  item,
  onView,
}: {
  item: BorrowRequest;
  onView: (id: number) => void;
}) {
  const cfg = getStatusConfig(item.borrowRequestStatus);
  const StatusIcon = cfg.icon;
  const createdAt = formatDate(item.borrowRequestCreatedAt);
  const fromDate = formatDate(item.borrowNeededFrom as any);
  const toDate = formatDate(item.borrowNeededTo as any);

  return (
    <div
      onClick={() => onView(item.borrowRequestId)}
      className={`
        group relative bg-white rounded-2xl border border-slate-200 
        border-l-4 ${cfg.accent}
        hover:shadow-lg hover:border-primary-200 hover:border-l-primary-500
        transition-all duration-200 cursor-pointer overflow-hidden
      `}
    >
      <div className="flex flex-col sm:flex-row gap-0">
        {/* Main Content */}
        <div className="flex-1 min-w-0 p-5">
          {/* Top Row: Status + Date */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {cfg.label}
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              สร้างเมื่อ {createdAt}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 mb-2 truncate group-hover:text-primary-700 transition-colors duration-200">
            {item.borrowRequestTitle || "(ไม่มีหัวข้อ)"}
          </h3>

          {/* Reason Preview */}
          {item.borrowRequestReason && (
            <div className="flex items-start gap-2 mb-4">
              <div className="p-1 bg-slate-50 rounded-md shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 line-clamp-1">
                {item.borrowRequestReason}
              </p>
            </div>
          )}

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{item.borrowNeededCount}</span>
              <span className="text-blue-500">คน</span>
            </div>

            {(fromDate || toDate) && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-700">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {fromDate || "—"} - {toDate || "—"}
                </span>
              </div>
            )}
          </div>

          {/* Step Progress */}
          <CompactStepProgress status={item.borrowRequestStatus} />
        </div>

        {/* Right Arrow Section */}
        <div className="hidden sm:flex items-center px-5 border-l border-slate-100 group-hover:border-primary-100 transition-colors">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-primary-50 flex items-center justify-center transition-all duration-200 group-hover:scale-110">
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary-600 transition-colors duration-200" />
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-primary-600 font-medium transition-colors">
              ดูเพิ่มเติม
            </span>
          </div>
        </div>

        {/* Mobile: Bottom Arrow */}
        <div className="sm:hidden flex items-center justify-end px-5 pb-4">
          <span className="text-xs text-slate-400 group-hover:text-primary-600 flex items-center gap-1 font-medium transition-colors">
            ดูรายละเอียด
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────── List ─────────── */

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
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-dashed border-slate-300 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-5">
          <Inbox className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          ยังไม่มีรายการคำขอ
        </h3>
        <p className="text-sm text-slate-500 max-w-sm">
          คุณยังไม่ได้สร้างคำขอยืมตัวที่ปรึกษาจากมหาวิทยาลัยอื่น
        </p>
        <p className="text-sm text-slate-400 mt-1">
          เริ่มสร้างคำขอใหม่ได้โดยกดปุ่ม &quot;สร้างคำขอ&quot; ด้านบน
        </p>
      </div>
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
