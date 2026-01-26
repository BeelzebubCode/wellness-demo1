// src/components/admin/bookings/BookingsListCard.tsx
"use client";

import { Card, LoadingSpinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  Clock3,
  User2,
  ArrowRightLeft,
  UserCheck,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

import type { AdminBookingRow as Booking } from "@/features/counseling-admin-bookings/type";

function ActionButton({
  tone,
  icon: Icon,
  label,
  onClick,
  disabled,
  title,
}: {
  tone: "amber" | "emerald";
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const styles =
    tone === "amber"
      ? {
          wrap:
            "bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100/70 hover:border-amber-300",
          icon: "bg-amber-100 text-amber-800 group-hover:bg-amber-200/70",
          ring: "focus-visible:ring-amber-300/40",
          disabled:
            "opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-amber-50/80 hover:border-amber-200",
        }
      : {
          wrap:
            "bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70 hover:border-emerald-300",
          icon: "bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200/70",
          ring: "focus-visible:ring-emerald-300/40",
          disabled:
            "opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-emerald-50/80 hover:border-emerald-200",
        };

  return (
    <button
      type="button"
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      title={title}
      className={cn(
        "group inline-flex items-center justify-center gap-2",
        "h-10 px-4 rounded-full border",
        "text-xs font-semibold tracking-wide whitespace-nowrap",
        "shadow-[0_1px_0_rgba(0,0,0,0.05)]",
        "transition-all duration-200",
        "hover:-translate-y-[1px] hover:shadow-sm active:translate-y-0 active:shadow-none",
        "focus:outline-none focus-visible:ring-2",
        styles.ring,
        styles.wrap,
        disabled && styles.disabled,
      )}
    >
      <span
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center",
          "transition-colors",
          styles.icon,
          disabled && "group-hover:bg-inherit",
        )}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="leading-none">{label}</span>
    </button>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "PENDING_ASSIGNMENT").toUpperCase();

  const map: Record<string, { label: string; cls: string; dot: string }> = {
    PENDING_ASSIGNMENT: {
      label: "รอการยืนยัน",
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

function SectionTitle() {
  return (
    <div className="flex items-start justify-between gap-3 pb-3">
      <div className="min-w-0">
        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
          คิวในวันที่เลือก
        </h3>
        <p className="text-xs sm:text-sm text-gray-500">
          ตรวจสอบรายละเอียด เลื่อนเวลา หรือมอบหมายผู้ให้คำปรึกษา
        </p>
      </div>
    </div>
  );
}

function getAssignState(b: Booking) {
  if (b.status === "CANCELLED") return { can: false, reason: "รายการนี้ถูกยกเลิกแล้ว" };
  if (b.status === "COMPLETED") return { can: false, reason: "รายการนี้เสร็จสิ้นแล้ว" };

  if (b.status !== "PENDING_ASSIGNMENT") return { can: false, reason: "สถานะไม่อนุญาตให้แจกงาน" };
  if (b.consultantId != null) return { can: false, reason: "รายการนี้ถูกมอบหมายไปแล้ว" };

  return { can: true, reason: null as string | null };
}

export function BookingsListCard({
  isLoading,
  bookings,
  onOpenProblem,
  onOpenReschedule,
  onOpenAssign,
}: {
  isLoading: boolean;
  bookings: Booking[]; // ✅ list ที่กรองมาแล้ว
  onOpenProblem: (b: Booking) => void;
  onOpenReschedule: (b: Booking) => void;
  onOpenAssign: (b: Booking) => void;
}) {
  const safeOpenAssign = (b: Booking) => {
    const st = getAssignState(b);
    if (!st.can) return;
    onOpenAssign(b);
  };

  return (
    <Card className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <SectionTitle />

        {isLoading ? (
          <div className="py-14 flex items-center justify-center">
            <LoadingSpinner size="lg" label="กำลังโหลดข้อมูลคิว..." />
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Clock3 className="w-5 h-5 text-gray-400" />
            </div>
            <p className="mt-3 text-sm font-bold text-gray-800">ยังไม่มีคิวในวันที่เลือก</p>
            <p className="text-xs text-gray-500 mt-1">ลองเลือกวันอื่น หรือกดรีเฟรชอีกครั้ง</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[1.35fr,0.9fr,1.15fr,0.9fr,1.2fr] text-xs font-bold text-gray-600">
              <div className="px-4 py-2 rounded-l-xl bg-gray-50 border border-gray-100">ผู้จอง</div>
              <div className="px-4 py-2 bg-gray-50 border-t border-b border-gray-100">เวลา</div>
              <div className="px-4 py-2 bg-gray-50 border-t border-b border-gray-100">ประเภทปัญหา</div>
              <div className="px-4 py-2 bg-gray-50 border-t border-b border-gray-100">สถานะ</div>
              <div className="px-4 py-2 rounded-r-xl bg-gray-50 border border-gray-100 text-right">การจัดการ</div>
            </div>

            <div className="mt-3 space-y-3">
              {bookings.map((booking) => {
                const assignState = getAssignState(booking);

                return (
                  <div key={booking.id}>
                    {/* Mobile Card */}
                    <div className="md:hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100">
                              <User2 className="w-5 h-5 text-primary-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-gray-900 truncate">
                                {booking.userName ?? "ไม่ทราบชื่อ"}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                LINE ID: {booking.lineUserId ?? "-"}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={booking.status ?? null} />
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-gray-800">
                          <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <Clock3 className="w-4 h-4 text-primary-500" />
                          </div>
                          <div className="text-sm font-bold">
                            {booking.startTime}–{booking.endTime} น.
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenProblem(booking)}
                          className="mt-3 w-full text-left rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition p-3 group"
                          title="กดเพื่อดูรายละเอียด"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-extrabold text-gray-900 truncate group-hover:text-primary-700">
                              {booking.problemType ?? "-"}
                            </p>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                          </div>

                          {booking.problemDescription ? (
                            <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                              {booking.problemDescription}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-gray-400">ไม่มีรายละเอียดเพิ่มเติม</p>
                          )}

                          <p className="mt-2 text-[11px] font-semibold text-primary-600 opacity-80">
                            แตะเพื่อดูรายละเอียด
                          </p>
                        </button>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <ActionButton
                            tone="amber"
                            icon={ArrowRightLeft}
                            label="เลื่อนเวลา"
                            onClick={() => onOpenReschedule(booking)}
                          />
                          <ActionButton
                            tone="emerald"
                            icon={UserCheck}
                            label="แจกงาน"
                            onClick={() => safeOpenAssign(booking)}
                            disabled={!assignState.can}
                            title={assignState.reason ?? undefined}
                          />
                        </div>

                        {!assignState.can && (
                          <div className="mt-2 text-[11px] text-amber-700 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {assignState.reason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Row */}
                    <div
                      className={cn(
                        "hidden md:grid grid-cols-[1.35fr,0.9fr,1.15fr,0.9fr,1.2fr] items-center",
                        "rounded-2xl border border-gray-100 bg-white",
                        "hover:shadow-md hover:border-gray-200 transition-all",
                      )}
                    >
                      <div className="px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100">
                            <User2 className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-gray-900 truncate">
                              {booking.userName ?? "ไม่ทราบชื่อ"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              LINE ID: {booking.lineUserId ?? "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-2 text-gray-800 whitespace-nowrap">
                          <Clock3 className="w-4 h-4 text-primary-500" />
                          <span className="text-sm font-bold">
                            {booking.startTime}–{booking.endTime} น.
                          </span>
                        </div>
                      </div>

                      <div className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => onOpenProblem(booking)}
                          className="w-full text-left group"
                          title="กดเพื่อดูรายละเอียด"
                        >
                          <p className="text-sm font-extrabold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                            {booking.problemType ?? "-"}
                          </p>
                          {booking.problemDescription ? (
                            <p className="text-xs text-gray-600 line-clamp-1 group-hover:text-gray-700">
                              {booking.problemDescription}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">ไม่มีรายละเอียดเพิ่มเติม</p>
                          )}
                        </button>
                      </div>

                      <div className="px-4 py-3.5">
                        <StatusBadge status={booking.status ?? null} />
                      </div>

                      <div className="px-4 py-3.5 flex justify-end gap-2 items-center">
                        <ActionButton
                          tone="amber"
                          icon={ArrowRightLeft}
                          label="เลื่อนเวลา"
                          onClick={() => onOpenReschedule(booking)}
                        />

                        <div className="flex flex-col items-end gap-1">
                          <ActionButton
                            tone="emerald"
                            icon={UserCheck}
                            label="แจกงาน"
                            onClick={() => safeOpenAssign(booking)}
                            disabled={!assignState.can}
                            title={assignState.reason ?? undefined}
                          />
                          {!assignState.can && (
                            <span className="text-[11px] text-amber-700">{assignState.reason}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
