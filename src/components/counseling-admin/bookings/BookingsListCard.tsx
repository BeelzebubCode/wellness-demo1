"use client";

import React from "react";
import { Card, LoadingSpinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  Clock3,
  User2,
  ArrowRightLeft,
  UserCheck,
  ChevronRight,
  AlertTriangle,
  FileText,
} from "lucide-react";

import type { AdminBookingRow as Booking } from "@/features/counseling-admin-bookings/type";

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
  };

  const cfg = map[s] ?? map.PENDING_ASSIGNMENT;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold",
        "text-[11px] sm:text-xs whitespace-nowrap",
        cfg.cls,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
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
  tone: "amber" | "emerald" | "slate";
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
        disabled && "opacity-60 cursor-not-allowed hover:bg-inherit",
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}


function SectionTitle({ count }: { count: number }) {
  return (
    <div className="flex items-start justify-between gap-3 pb-3">
      <div className="min-w-0">
        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
          คิวในวันที่เลือก
        </h3>
        <p className="text-xs sm:text-sm text-gray-500">
          คลิกแถวเพื่อดูรายละเอียด • พบ {count} รายการ
        </p>
      </div>
    </div>
  );
}

/* -------------------- rules -------------------- */

function getAssignState(b: Booking) {
  if (b.status === "CANCELLED")
    return { can: false, reason: "รายการนี้ถูกยกเลิกแล้ว" };
  if (b.status === "COMPLETED")
    return { can: false, reason: "รายการนี้เสร็จสิ้นแล้ว" };
  if (b.status !== "PENDING_ASSIGNMENT")
    return { can: false, reason: "สถานะไม่อนุญาตให้แจกงาน" };
  if ((b as any).consultantId != null)
    return { can: false, reason: "รายการนี้ถูกมอบหมายไปแล้ว" };
  return { can: true, reason: null as string | null };
}

/* -------------------- component -------------------- */

function assignLabel(
  assign: { can: boolean; reason?: string | null },
  status?: string,
) {
  if (assign.can) return "แจกงาน";

  switch (status) {
    case "ASSIGNED":
      return "แจกงานแล้ว";
    case "COMPLETED":
      return "เสร็จสิ้นแล้ว";
    case "CANCELLED":
      return "ยกเลิกแล้ว";
    default:
      return "ไม่สามารถแจกงาน";
  }
}

export function BookingsListCard({
  isLoading,
  bookings,
  onOpenProblem,
  onOpenReschedule,
  onOpenAssign,
}: {
  isLoading: boolean;
  bookings: Booking[];
  onOpenProblem: (b: Booking) => void;
  onOpenReschedule: (b: Booking) => void;
  onOpenAssign: (b: Booking) => void;
}) {
  return (
    <Card className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <SectionTitle count={bookings.length} />

        {isLoading ? (
          <div className="py-14 flex items-center justify-center">
            <LoadingSpinner size="lg" label="กำลังโหลดข้อมูลคิว..." />
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Clock3 className="w-5 h-5 text-gray-400" />
            </div>
            <p className="mt-3 text-sm font-bold text-gray-800">
              ยังไม่มีคิวในวันที่เลือก
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ลองเลือกวันอื่น หรือกดรีเฟรชอีกครั้ง
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {bookings.map((b) => {
              const assign = getAssignState(b);

              return (
                <div
                  key={b.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenProblem(b)}
                  className={cn(
                    "group rounded-2xl border border-gray-100 bg-white",
                    "hover:border-gray-200 hover:shadow-md transition-all",
                    "cursor-pointer",
                  )}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100 shrink-0">
                        <User2 className="w-5 h-5 text-primary-600" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-extrabold text-gray-900 truncate">
                            {b.userName ?? "ไม่ทราบชื่อ"}
                          </p>
                          <StatusBadge status={b.status ?? null} />
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="truncate">
                            LINE: {b.lineUserId ?? "-"}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="inline-flex items-center gap-1.5 font-bold text-gray-800">
                            <Clock3 className="w-4 h-4 text-primary-500" />
                            {b.startTime}–{b.endTime} น.
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Chip>
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            {b.problemType ?? "-"}
                          </Chip>

                          {b.problemDescription ? (
                            <span className="text-xs text-gray-600 line-clamp-1">
                              {b.problemDescription}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              ไม่มีรายละเอียด
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0 mt-1" />
                  </div>

                  {/* Actions row */}
                  <div className="flex justify-between gap-2 border-t border-gray-100 px-4 py-3">
                    {/* Left hint */}
                    <div className="text-[11px] text-gray-500 self-center">
                      คลิกเพื่อดูรายละเอียด
                    </div>

                    {/* Right actions */}
                    <div className="flex items-end gap-2">
                      <IconAction
                        tone="amber"
                        icon={ArrowRightLeft}
                        label="เลื่อนเวลา"
                        onClick={() => onOpenReschedule(b)}
                      />

                      <IconAction
                        tone={assign.can ? "emerald" : "slate"}
                        icon={UserCheck}
                        label={assignLabel(assign, b.status)}
                        disabled={!assign.can}
                        title={assign.reason ?? undefined}
                        onClick={() => assign.can && onOpenAssign(b)}
                      />
                    </div>
                  </div>

                  {/* Mobile hint spacing (optional) */}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
