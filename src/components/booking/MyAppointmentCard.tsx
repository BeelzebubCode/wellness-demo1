"use client";

import { cn } from "@/lib/cn";
import { formatThaiDate } from "@/lib/date";
import { BOOKING_STATUS } from "@/lib/constants";
import { Card, Button } from "@/components/ui";
import type { Booking } from "@/features/booking/types";
import {
  Clock,
  XCircle,
  Star,
  ChevronDown,
  MessageSquarePlus,
} from "lucide-react";

export interface MyAppointmentCardProps {
  booking: Booking;
  onCancel?: () => void;
  isCompact?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onFeedback?: () => void;
}

export function MyAppointmentCard({
  booking,
  onCancel,
  isCompact = false,
  isExpanded = false,
  onToggle,
  onFeedback,
}: MyAppointmentCardProps) {
  // ✅ Normalize status ให้ match key ใน BOOKING_STATUS ชัวร์
  const statusKey = String((booking as any).status ?? "")
    .trim()
    .toUpperCase() as keyof typeof BOOKING_STATUS;

  // ✅ Fallback กัน statusConfig undefined (กันพังตอน .icon)
  const statusConfig =
    BOOKING_STATUS[statusKey] ??
    ({
      label: String((booking as any).status ?? "UNKNOWN"),
      icon: Clock,
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
    } as const);

  const StatusIcon = statusConfig.icon;

  const hasDate = Boolean(booking.date && booking.startTime && booking.endTime);

  // ✅ Completed แบบทนเคส backend ส่งค่าแปลกๆ
  const isCompleted = statusKey === "COMPLETED";

  // ✅ hasFeedback แบบ robust (กัน string/number/field คนละชื่อ)
  const hasFeedback =
    Boolean((booking as any).hasFeedback) ||
    Boolean((booking as any).feedbackId) ||
    Boolean((booking as any).feedbackSubmitted) ||
    (Array.isArray((booking as any).feedbacks) &&
      (booking as any).feedbacks.length > 0);

  // ✅ ปุ่ม Feedback แสดงเมื่อ: จบงาน + ยังไม่เคยประเมิน + มี callback
  const showFeedbackAction = true;
  // const showFeedbackAction =
  //   isCompleted && !hasFeedback && typeof onFeedback === "function";

  /* ======================================================
     ✅ COMPACT MODE (History) — Enhanced UI
  ====================================================== */
  if (isCompact) {
    const fullDate = booking.date
      ? new Date(booking.date).toLocaleDateString("th-TH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

    const bookingIdText = `#${String(booking.id).padStart(6, "0")}`;

    const problemDesc =
      (booking as any).problemDescription ?? (booking as any).description ?? null;

    const cancelReason = (booking as any).cancelReason ?? null;

    const consultantName =
      (booking as any).consultantName ??
      (booking as any).consultant?.displayName ??
      (booking as any).consultant?.name ??
      null;

    return (
      <div
        className={cn(
          "group rounded-xl border bg-white overflow-hidden transition-all duration-200",
          "hover:shadow-md hover:border-blue-100",
          isExpanded ? "shadow-md border-blue-200 ring-1 ring-blue-100" : ""
        )}
      >
        {/* === HEADER ROW (Always Visible) === */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggle?.()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggle?.();
          }}
          className={cn(
            "relative w-full text-left flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 transition select-none cursor-pointer",
            isExpanded ? "bg-blue-50/30" : "bg-white group-hover:bg-gray-50/50"
          )}
        >
          {/* 1. DATE BOX */}
          {booking.date ? (
            <div
              className={cn(
                "shrink-0 w-[52px] flex flex-col items-center rounded-lg border bg-white overflow-hidden shadow-sm",
                isExpanded ? "border-blue-200" : "border-gray-200"
              )}
            >
              <div className="w-full bg-gray-100 text-[10px] font-medium text-gray-500 text-center py-0.5 border-b border-gray-100">
                {new Date(booking.date).toLocaleDateString("th-TH", {
                  weekday: "short",
                })}
              </div>
              <div className="text-xl font-bold text-gray-800 py-1">
                {new Date(booking.date).getDate()}
              </div>
            </div>
          ) : (
            <div className="w-[52px] shrink-0" />
          )}

          {/* 2. MAIN CONTENT */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold rounded-full px-2 py-0.5 border",
                  statusConfig.bgColor,
                  statusConfig.textColor,
                  statusConfig.borderColor
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>

              {hasDate && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {booking.startTime}-{booking.endTime}
                </span>
              )}
            </div>

            <div className="font-medium text-sm text-gray-900 truncate pr-2">
              {booking.problemType || "ไม่ระบุหัวข้อปัญหา"}
            </div>
          </div>

          {/* 3. ACTION AREA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ✅ FEEDBACK BUTTON */}
            {showFeedbackAction && (
              <Button
                size="sm"
                variant="primary" // ✅ เปลี่ยนจาก default (กัน type error)
                className="h-8 px-3 text-xs shadow-sm bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-in fade-in zoom-in duration-300 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback?.();
                }}
              >
                <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />
                <span className="hidden sm:inline">ประเมิน</span>
                <span className="sm:hidden">ให้ดาว</span>
              </Button>
            )}

            {/* CHEVRON */}
            {onToggle && (
              <div
                className={cn(
                  "shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-transform duration-200 text-gray-400 hover:bg-gray-100",
                  isExpanded && "rotate-180 bg-gray-100 text-gray-600"
                )}
              >
                <ChevronDown className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        {/* === EXPANDED DETAIL === */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 sm:px-5">
            {/* Meta Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                  Booking ID
                </p>
                <p className="text-sm font-mono text-gray-600 select-all">
                  {bookingIdText}
                </p>
              </div>

              {/* Mobile hint */}
              {showFeedbackAction && (
                <div className="sm:hidden text-xs text-amber-600 font-medium flex items-center animate-pulse">
                  <MessageSquarePlus className="w-3 h-3 mr-1" />
                  รอการประเมิน
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Consultant */}
              {consultantName && (
                <div className="col-span-1 sm:col-span-2 bg-white border rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">ผู้ให้คำปรึกษา</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {consultantName}
                  </p>
                </div>
              )}

              {/* Date */}
              <div className="bg-white border rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">วันที่นัดหมาย</p>
                <p className="text-sm text-gray-700">{fullDate || "-"}</p>
              </div>

              {/* Time (กัน undefined) */}
              <div className="bg-white border rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">เวลา</p>
                <p className="text-sm text-gray-700">
                  {booking.startTime ?? "-"} – {booking.endTime ?? "-"} น.
                </p>
              </div>

              {/* Details */}
              {problemDesc && (
                <div className="sm:col-span-2 bg-white border rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-2">รายละเอียดเพิ่มเติม</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {problemDesc}
                  </p>
                </div>
              )}

              {/* Cancel Reason */}
              {cancelReason && (
                <div className="sm:col-span-2 bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs text-red-500 font-semibold mb-1">
                    เหตุผลการยกเลิก
                  </p>
                  <p className="text-sm text-red-700">{cancelReason}</p>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <span
                onClick={onToggle}
                className="text-[11px] text-gray-400 cursor-pointer hover:text-gray-600 underline decoration-dotted underline-offset-2"
              >
                ซ่อนรายละเอียด
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ======================================================
     ✅ NORMAL MODE (Active booking) — Card Style
  ====================================================== */
  return (
    <Card
      className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-200"
      padding="none"
    >
      <div
        className={cn(
          "px-4 py-3 border-b flex items-center justify-between",
          statusConfig.bgColor
        )}
      >
        <span className={cn("text-sm font-semibold flex items-center gap-2", statusConfig.textColor)}>
          <StatusIcon className="w-4 h-4" />
          {statusConfig.label}
        </span>
        <span className="text-xs font-mono opacity-60">
          #{String(booking.id).padStart(6, "0")}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {hasDate && (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">
                {formatThaiDate(new Date(booking.date!))}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                เวลา {booking.startTime} – {booking.endTime} น.
              </p>
            </div>
          </div>
        )}

        {booking.problemType && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">หัวข้อปัญหา</p>
            <p className="text-sm font-medium text-gray-700">{booking.problemType}</p>
          </div>
        )}

        {onCancel && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              ยกเลิกการจอง
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
