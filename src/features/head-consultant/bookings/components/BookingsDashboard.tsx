// src/features/head-consultant/bookings/components/BookingsDashboard.tsx
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronDown, ClipboardList } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";
import type { AdminBookingRow, AssigneeOption, BookingStatus } from "../types";
import { BookingsListCard } from "./BookingsListCard";
import { AssignBookingModal } from "./modals/AssignBookingModal";
import { ProblemDetailsModal } from "./modals/ProblemDetailsModal";
import { RescheduleBookingModal } from "./modals/RescheduleBookingModal";

const ITEMS_PER_PAGE = 10;

export function BookingsDashboard({
  selectedDate,
  onChangeDate,

  statusFilter,
  setStatusFilter,

  rows,
  isLoading,
  error,

  assignees,
  isLoadingAssignees,

  onRefresh,
  onAssign,
  onReschedule,
}: {
  selectedDate?: Date;
  onChangeDate: (d: Date) => void;

  statusFilter: BookingStatus | "ALL";
  setStatusFilter: (s: BookingStatus | "ALL") => void;

  rows: AdminBookingRow[];
  isLoading: boolean;
  error: string | null;

  assignees: AssigneeOption[];
  isLoadingAssignees: boolean;

  onRefresh: () => void;
  onAssign: (bookingId: number, consultantId: number, borrowAssignmentId?: number) => Promise<void>;
  onReschedule: (bookingId: number, isoDateTime: string) => Promise<void>;
}) {
  const [activeRow, setActiveRow] = useState<AdminBookingRow | null>(null);

  const [openDetails, setOpenDetails] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openReschedule, setOpenReschedule] = useState(false);

  const [isSavingAssign, setIsSavingAssign] = useState(false);
  const [isSavingReschedule, setIsSavingReschedule] = useState(false);

  // ── Auto-assign trigger (เรียก API แล้ว refresh) ──
  const autoAssignBusyRef = useRef(false);
  const handleAutoAssignExpired = useCallback(async () => {
    if (autoAssignBusyRef.current) return; // กัน fire ซ้ำ
    autoAssignBusyRef.current = true;
    try {
      console.log("[AutoAssign] Countdown expired → calling /api/cron/auto-assign");
      const res = await fetch("/api/cron/auto-assign", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      console.log("[AutoAssign] Result:", data);
      // refresh booking list ให้เห็นผลลัพธ์
      onRefresh();
    } catch (err) {
      console.error("[AutoAssign] Error:", err);
    } finally {
      // ปล่อย lock หลังจาก 3 วินาที กัน spam
      setTimeout(() => { autoAssignBusyRef.current = false; }, 3000);
    }
  }, [onRefresh]);

  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when rows change (e.g. filter changed)
  const rowsKey = rows.length;
  const [prevRowsKey, setPrevRowsKey] = useState(rowsKey);
  if (rowsKey !== prevRowsKey) {
    setPrevRowsKey(rowsKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const paginatedRows = rows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-4">
      {/* error */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Glass container */}
      <div className="relative bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden">
        {/* Header with Score Bar */}
        <div className="px-8 py-5 border-b border-slate-100/80 bg-gradient-to-r from-white/90 to-blue-50/30 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-6 bg-gradient-to-b from-primary-500 to-blue-500 rounded-full shadow-lg" />
              <div>
                <p className="text-sm font-bold text-slate-800 leading-none">
                  รายการนัดหมาย
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-none">
                  ทั้งหมด {rows.length} รายการ
                </p>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>

          {/* Dynamic Score Bar */}
          {rows.length > 0 && (
            <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-slate-100 mt-2 shadow-inner">
              {(() => {
                const total = rows.length;
                const pend = rows.filter(r => r.status === "PENDING_ASSIGNMENT").length;
                const asig = rows.filter(r => r.status === "ASSIGNED" || r.status === "IN_PROGRESS").length;
                const comp = rows.filter(r => r.status === "COMPLETED").length;
                const canc = rows.filter(r => r.status === "CANCELLED").length;

                return (
                  <>
                    {pend > 0 && <div style={{ width: `${(pend / total) * 100}%` }} className="bg-amber-400 transition-all duration-500 hover:brightness-110" title={`รอมอบหมาย: ${pend}`} />}
                    {asig > 0 && <div style={{ width: `${(asig / total) * 100}%` }} className="bg-blue-500 transition-all duration-500 hover:brightness-110" title={`กำลังดำเนินการ: ${asig}`} />}
                    {comp > 0 && <div style={{ width: `${(comp / total) * 100}%` }} className="bg-emerald-500 transition-all duration-500 hover:brightness-110" title={`เสร็จสิ้น: ${comp}`} />}
                    {canc > 0 && <div style={{ width: `${(canc / total) * 100}%` }} className="bg-slate-300 transition-all duration-500 hover:brightness-110" title={`ยกเลิก: ${canc}`} />}
                  </>
                );
              })()}
            </div>
          )}
          {rows.length > 0 && (
            <div className="flex items-center gap-4 mt-3 text-[10px] font-medium text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> รอมอบหมาย</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> ดำเนินการ</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> เสร็จสิ้น</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> ยกเลิก</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 bg-gradient-to-b from-slate-50/40 to-white/40 min-h-[420px]">
          {isLoading ? (
            <div className="h-[360px] flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">กำลังโหลดข้อมูล...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="h-[360px] flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                <ClipboardList className="w-10 h-10 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-600">
                  {selectedDate ? "ไม่มีรายการในวันที่เลือก" : "ไม่มีรายการทั้งหมด"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ลองเปลี่ยนวันที่หรือตัวกรองอื่นๆ
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedRows.map((r, index) => (
                <div
                  key={String(r.id)}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationDuration: "350ms",
                    animationFillMode: "both",
                  }}
                >
                  <BookingsListCard
                    row={r}
                    onClickDetails={() => {
                      setActiveRow(r);
                      setOpenDetails(true);
                    }}
                    onClickAssign={() => {
                      setActiveRow(r);
                      setOpenAssign(true);
                    }}
                    onAutoAssignExpired={handleAutoAssignExpired}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-8 py-5 border-t border-slate-100/80 bg-white/50 backdrop-blur-sm flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500">
              หน้าที่ {currentPage} จากทั้งหมด {totalPages}
            </div>
            <div className="flex items-center gap-1.5">
              {/* Prev */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isAround = Math.abs(p - currentPage) <= 1;
                  const isFirstLast = p === 1 || p === totalPages;

                  if (!isAround && !isFirstLast) {
                    if (p === 2 || p === totalPages - 1) {
                      return <span key={p} className="w-4 text-center text-slate-400 text-xs">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all",
                        currentPage === p
                          ? "bg-primary-500 text-white shadow-md shadow-primary-500/20 scale-105"
                          : "bg-white border border-slate-200 text-slate-600 hover:border-primary-400/40 hover:text-primary-600",
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Next */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* modals */}
      <ProblemDetailsModal
        open={openDetails}
        onOpenChange={(v) => {
          setOpenDetails(v);
          if (!v) setActiveRow(null);
        }}
        booking={activeRow}
      />

      <AssignBookingModal
        open={openAssign}
        onOpenChange={(v) => {
          setOpenAssign(v);
          if (!v) setActiveRow(null);
        }}
        booking={activeRow}
        assignees={assignees}
        isLoadingAssignees={isLoadingAssignees}
        isSaving={isSavingAssign}
        onConfirmAssign={async (bookingId, consultantId, borrowAssignmentId) => {
          setIsSavingAssign(true);
          try {
            await onAssign(bookingId, consultantId, borrowAssignmentId);
            onRefresh();
          } finally {
            setIsSavingAssign(false);
          }
        }}
      />

      <RescheduleBookingModal
        open={openReschedule}
        onOpenChange={(v) => {
          setOpenReschedule(v);
          if (!v) setActiveRow(null);
        }}
        booking={activeRow}
        isSaving={isSavingReschedule}
        onConfirmReschedule={async (bookingId, isoDateTime) => {
          setIsSavingReschedule(true);
          try {
            await onReschedule(bookingId, isoDateTime);
            onRefresh();
          } finally {
            setIsSavingReschedule(false);
          }
        }}
      />
    </div>
  );
}
