//src\components\super-admin\borrow-requests\BorrowRequestTable.tsx

"use client";

import { useMemo, useState } from "react";
import { Users, Eye, FileText, Clock, Building2, Search, Inbox } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui";
import { FilterBar } from "@/components/filters/FilterBar";
import {
  BORROW_REQUESTS_FILTER_DEFS,
  type BorrowRequestsFilters,
} from "@/features/borrow-requests/filters/defs";
import type { BorrowRequest } from "@/features/borrow-requests/types";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  SUBMITTED: {
    label: "รอดำเนินการ",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  ASSIGNED: {
    label: "มอบหมายแล้ว",
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    bg: "bg-slate-50",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
  CANCELLED: {
    label: "ยกเลิก",
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-400",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "bg-gray-50",
    text: "text-gray-600",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function BorrowRequestsTable({
  rows,
  loading,
  onView,
  onApprove,
  onAssign,
}: {
  rows: BorrowRequest[];
  loading?: boolean;
  onView: (id: number) => void;
  onApprove: (id: number) => void;
  onAssign: (id: number) => void;
}) {
  const [filters, setFilters] = useState<BorrowRequestsFilters>({
    status: "ALL",
    q: "",
  });

  const safeRows = Array.isArray(rows) ? rows : [];

  const filtered = useMemo(() => {
    let list = safeRows;
    if (filters.status && filters.status !== "ALL") {
      list = list.filter((r) => r.borrowRequestStatus === filters.status);
    }
    const q = (filters.q || "").trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.borrowRequestTitle.toLowerCase().includes(q) ||
          r.borrowRequestReason.toLowerCase().includes(q),
      );
    }
    return list;
  }, [safeRows, filters]);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md shadow-primary-200/40">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              คำขอยืมตัวที่ปรึกษา
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? "กำลังโหลด..." : `ทั้งหมด ${safeRows.length} รายการ · แสดง ${filtered.length} รายการ`}
            </p>
          </div>
        </div>
        {loading && <LoadingSpinner />}
      </div>

      {/* ── Filter ── */}
      <FilterBar
        defs={BORROW_REQUESTS_FILTER_DEFS}
        value={filters}
        onChange={setFilters}
        searchKey="q"
        searchPlaceholder="ค้นหาหัวข้อ / เหตุผล..."
      />

      {/* ── List ── */}
      <div className="space-y-2">
        {filtered.map((r) => (
          <Card
            key={r.borrowRequestId}
            className="group rounded-xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer"
            onClick={() => onView(r.borrowRequestId)}
          >
            <div className="p-4 flex items-center gap-4">
              {/* Left: ID badge */}
              <div className="flex-shrink-0">
                <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
                  <span className="text-sm font-bold text-slate-500 group-hover:text-primary-600 transition-colors">
                    #{r.borrowRequestId}
                  </span>
                </div>
              </div>

              {/* Center: Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-800 truncate">
                    {r.borrowRequestTitle}
                  </span>
                  <StatusBadge status={r.borrowRequestStatus} />
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {r.borrowRequestReason}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Users className="w-3 h-3" />
                    {r.borrowNeededCount} คน
                  </span>
                  {(r as any).fromUniversityNameTh && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Building2 className="w-3 h-3" />
                      {(r as any).fromUniversityNameTh}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Action */}
              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(r.borrowRequestId)}
                  className="rounded-lg shadow-sm text-slate-600 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/50"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  ดูรายละเอียด
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {/* ── Empty state ── */}
        {!filtered.length && !loading && (
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <div className="py-14 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">ไม่พบรายการ</p>
              <p className="text-xs text-slate-400 mt-1">
                ลองเปลี่ยนตัวกรองหรือคำค้นหาดูใหม่
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
