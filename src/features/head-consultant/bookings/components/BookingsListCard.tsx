// src/features/head-consultant/bookings/components/BookingsListCard.tsx

"use client";

import React, { useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  Clock3,
  User2,
  ArrowRightLeft,
  UserCheck,
  ChevronRight,
  FileText,
} from "lucide-react";

import type { AdminBookingRow } from "../types";
import { useAutoAssignCountdown } from "../hook/useAutoAssignCountdown";

/* -------------------- small ui helpers -------------------- */

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "PENDING_ASSIGNMENT").toUpperCase();

  const map: Record<string, { label: string; cls: string; dot: string }> = {
    PENDING_ASSIGNMENT: {
      label: "รอมอบหมาย",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-600",
    },
    ASSIGNED: {
      label: "มอบหมายแล้ว",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-600",
    },
    IN_PROGRESS: {
      label: "กำลังให้คำปรึกษา",
      cls: "bg-sky-50 text-sky-700 border-sky-200",
      dot: "bg-sky-600",
    },
    COMPLETED: {
      label: "เสร็จสิ้น",
      cls: "bg-gray-100 text-gray-700 border-gray-200",
      dot: "bg-gray-500",
    },
    CANCELLED: {
      label: "ยกเลิก",
      cls: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-600",
    },
    EXPIRED: {
      label: "หมดเวลา",
      cls: "bg-gray-100 text-gray-500 border-gray-300",
      dot: "bg-gray-400",
    },
  };

  const cfg = map[s] ?? map.PENDING_ASSIGNMENT;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold",
        "text-[11px] sm:text-xs whitespace-nowrap",
        cfg.cls,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700">
      {children}
    </span>
  );
}

function IconAction({
  icon: Icon,
  label,
  tone,
  disabled,
  title,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  tone: "amber" | "emerald" | "slate" | "blue";
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full border px-3 h-9 text-xs font-bold whitespace-nowrap transition";

  const style =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
        : tone === "blue"
          ? "border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100"
          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100";

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      className={cn(
        base,
        style,
        "shadow-[0_1px_0_rgba(0,0,0,0.04)]",
        disabled && "cursor-not-allowed opacity-60 hover:bg-inherit",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

/* -------------------- rules -------------------- */

function getAssignState(b: AdminBookingRow) {
  if (b.status === "CANCELLED") return { can: false, isAutoAssigned: false, reason: "รายการนี้ถูกยกเลิกแล้ว" };
  if (b.status === "COMPLETED") return { can: false, isAutoAssigned: false, reason: "รายการนี้เสร็จสิ้นแล้ว" };

  // Check if auto-assigned
  const latestAssignment = b.assignments?.[0];
  const isAuto = latestAssignment?.isAutoAssigned === true;

  if (b.status === "ASSIGNED" || b.status === "IN_PROGRESS") {
    if (isAuto) {
      // ✅ Allow editing auto-assigned bookings if the time slot hasn't started yet
      const slotStarted = isSlotStarted(b.date, b.startTime);
      if (slotStarted) {
        return { can: false, isAutoAssigned: true, isEdit: true, reason: "เลยเวลานัดหมายแล้ว ไม่สามารถแก้ไขได้" };
      }
      // Slot hasn't started → allow edit
      return { can: true, isAutoAssigned: true, isEdit: true, reason: null as string | null };
    }
    return { can: true, isAutoAssigned: false, isEdit: true, reason: null as string | null };
  }
  if (b.status === "PENDING_ASSIGNMENT") {
    return { can: true, isAutoAssigned: false, isEdit: false, reason: null as string | null };
  }

  return { can: false, isAutoAssigned: false, reason: "สถานะไม่อนุญาตให้แจกงาน" };
}

/** Check if the booking's time slot has already started */
function isSlotStarted(date: string | null, startTime: string | null): boolean {
  if (!date || !startTime) return false;
  try {
    // date = "YYYY-MM-DD", startTime = "HH:mm"
    const slotStart = new Date(`${date}T${startTime}:00`);
    return Date.now() >= slotStart.getTime();
  } catch {
    return false;
  }
}

function assignLabel(assign: { can: boolean; isEdit?: boolean; isAutoAssigned?: boolean }, status?: string) {
  if (assign.isAutoAssigned && !assign.can) return "🤖 แจกงานอัตโนมัติแล้ว";
  if (assign.can) return assign.isEdit ? "แก้ไขผู้ดูแล" : "แจกงาน";

  switch (status) {
    case "COMPLETED":
      return "เสร็จสิ้นแล้ว";
    case "CANCELLED":
      return "ยกเลิกแล้ว";
    default:
      return "ไม่สามารถแจกงาน";
  }
}

/* -------------------- component -------------------- */

export function BookingsListCard({
  row,
  onClickDetails,
  onClickAssign,
  onAutoAssignExpired,
}: {
  row: AdminBookingRow;
  onClickDetails: () => void;
  onClickAssign: () => void;
  onAutoAssignExpired?: () => void;
}) {
  const studentName = row.userName || row.student?.name || row.student?.username || "ไม่ทราบชื่อ";
  const assign = getAssignState(row);
  const stableOnExpire = useCallback(() => {
    onAutoAssignExpired?.();
  }, [onAutoAssignExpired]);
  const countdown = useAutoAssignCountdown(row.createdAt, row.status === "PENDING_ASSIGNMENT", stableOnExpire);

  const latestAssignment = row.assignments?.[0];
  const isAutoAssigned = latestAssignment?.isAutoAssigned;

  // Check if this is an expired (auto-cancelled) booking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawCancellation = row.cancellation as any;
  const isExpired = row.status === "CANCELLED" && rawCancellation?.cancellationReason?.cancellation_reason_code === "EXPIRED";
  const displayStatus = isExpired ? "EXPIRED" : row.status;

  const timeLabel =
    row.startTime && row.endTime ? `${row.startTime}–${row.endTime} น.` : "-";

  const consultantLabel = row.consultant?.name
    ? `consultant: ${row.consultant.name}`
    : "ยังไม่ assign";

  return (
    <Card className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={onClickDetails}
        className={cn(
          "group rounded-2xl border border-transparent",
          "hover:border-gray-200 hover:shadow-md transition-all",
          "cursor-pointer",
        )}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50">
              <User2 className="h-5 w-5 text-primary-600" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-extrabold text-gray-900">
                  {studentName}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <StatusBadge status={displayStatus ?? null} />

                  {row.status === "PENDING_ASSIGNMENT" && countdown && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 animate-pulse border border-amber-200">
                      <Clock3 className="h-3.5 w-3.5" />
                      {countdown}
                    </span>
                  )}
                  {row.status === "PENDING_ASSIGNMENT" && !countdown && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-800 border border-orange-200">
                      กำลังเข้าสู่ระบบแจกอัตโนมัติ...
                    </span>
                  )}
                  {latestAssignment && row.status !== "PENDING_ASSIGNMENT" && row.status !== "CANCELLED" && (
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border",
                      isAutoAssigned ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                    )}>
                      {isAutoAssigned ? "🤖 แจกงานอัตโนมัติ" : "🧑‍💻 จัดการเอง"}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="truncate">
                  booking_id: <span className="font-mono">{row.id}</span>
                </span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-gray-800">
                  <Clock3 className="h-4 w-4 text-primary-500" />
                  {timeLabel}
                </span>
                <span className="text-gray-300">•</span>
                <span className={cn("text-xs", row.consultant?.name ? "text-gray-600" : "text-gray-400")}>
                  {consultantLabel}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Chip>
                  <FileText className="mr-1 h-3.5 w-3.5" />
                  {row.problemType ?? "-"}
                </Chip>

                {row.problemDescription ? (
                  <span className="line-clamp-1 text-xs text-gray-600">
                    {row.problemDescription}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">ไม่มีรายละเอียด</span>
                )}

                {row.problemCategoryCode ? (
                  <span className="font-mono text-[11px] text-gray-400">
                    ({row.problemCategoryCode})
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-primary-500" />
        </div>

        {/* Actions row */}
        <div className="flex justify-between gap-2 border-t border-gray-100 px-4 py-3">
          <div className="self-center text-[11px] text-gray-500">
            คลิกแถวเพื่อดูรายละเอียด
          </div>

          <div className="flex items-end gap-2">
            <IconAction
              tone={assign.can ? (assign.isEdit ? "blue" : "emerald") : "slate"}
              icon={UserCheck}
              label={assignLabel(assign, row.status)}
              disabled={!assign.can}
              title={assign.reason ?? undefined}
              onClick={onClickAssign}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
