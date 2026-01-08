"use client";

import { cn } from "@/lib/cn";
import { formatThaiDate } from "@/lib/date";
import { BOOKING_STATUS } from "@/lib/constants";
import { Card, Button } from "@/components/ui";
import type { Booking } from "@/features/booking/types";
import { Clock, XCircle } from "lucide-react";

export interface MyAppointmentCardProps {
  booking: Booking;
  onCancel?: () => void;
  isCompact?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function MyAppointmentCard({
  booking,
  onCancel,
  isCompact = false,
  isExpanded = false,
  onToggle,
}: MyAppointmentCardProps) {
  const statusConfig =
    BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS];
  const StatusIcon = statusConfig.icon;

  const hasDate = !!booking.date && !!booking.startTime && !!booking.endTime;

  /* ======================================================
   ✅ COMPACT MODE (History) — New UI
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

    // ✅ ปรับชื่อ field ตาม type Booking ของนายได้:
    // - booking.problemDescription / booking.description
    // - booking.cancelReason
    // - booking.consultantName / booking.consultant?.displayName
    const problemDesc =
      (booking as any).problemDescription ??
      (booking as any).description ??
      null;

    const cancelReason = (booking as any).cancelReason ?? null;

    const consultantName =
      (booking as any).consultantName ??
      (booking as any).consultant?.displayName ??
      (booking as any).consultant?.name ??
      null;

    return (
      <div className="rounded-xl border bg-white overflow-hidden hover:shadow-sm transition">
        {/* COLLAPSED ROW */}
        <button
          type="button"
          onClick={() => onToggle?.()}
          className={cn(
            "w-full text-left flex items-center gap-3 px-4 py-3 transition",
            "hover:bg-gray-50",
            isExpanded && "bg-gray-50"
          )}
        >
          {/* DATE (small) */}
          {booking.date ? (
            <div className="w-12 shrink-0 rounded-lg border bg-white px-2 py-2 text-center">
              <div className="text-[10px] font-medium text-gray-500">
                {new Date(booking.date).toLocaleDateString("th-TH", {
                  weekday: "short",
                })}
              </div>
              <div className="text-lg font-extrabold text-gray-800 leading-tight">
                {new Date(booking.date).getDate()}
              </div>
            </div>
          ) : (
            <div className="w-12 shrink-0" />
          )}

          {/* MAIN */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 border",
                  statusConfig.bgColor,
                  statusConfig.textColor,
                  statusConfig.borderColor
                )}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>

              {hasDate && (
                <span className="text-xs text-gray-500 flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {booking.startTime}–{booking.endTime}
                </span>
              )}
            </div>

            {booking.problemType && (
              <div className="mt-1 text-sm font-semibold text-gray-800 truncate">
                {booking.problemType}
              </div>
            )}
          </div>

          {/* CHEVRON */}
          {onToggle && (
            <div
              className={cn(
                "shrink-0 text-gray-400 transition-transform",
                isExpanded && "rotate-180"
              )}
            >
              ▾
            </div>
          )}
        </button>

        {/* EXPANDED DETAIL (เยอะขึ้น) */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
          )}
          style={{ overflow: "hidden" }}
        >
          <div className="border-t bg-white px-5 py-4">
            {/* TOP META */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">รหัสการจอง</p>
                <p className="text-sm font-semibold text-gray-800">
                  {bookingIdText}
                </p>
              </div>

              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 border",
                  statusConfig.bgColor,
                  statusConfig.textColor,
                  statusConfig.borderColor
                )}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>
            </div>

            {/* GRID DETAIL */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* วันที่ */}
              {fullDate && (
                <div className="rounded-xl bg-gray-50 border p-3">
                  <p className="text-xs text-gray-500 mb-1">วันที่</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {fullDate}
                  </p>
                </div>
              )}

              {/* เวลา */}
              {hasDate && (
                <div className="rounded-xl bg-gray-50 border p-3">
                  <p className="text-xs text-gray-500 mb-1">ช่วงเวลา</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {booking.startTime} – {booking.endTime} น.
                  </p>
                </div>
              )}

              {/* ประเภทปัญหา */}
              {booking.problemType && (
                <div className="sm:col-span-2 rounded-xl bg-gray-50 border p-3">
                  <p className="text-xs text-gray-500 mb-1">ประเภทปัญหา</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {booking.problemType}
                  </p>
                </div>
              )}

              {/* ผู้ให้คำปรึกษา (ถ้ามี) */}
              {consultantName && (
                <div className="sm:col-span-2 rounded-xl bg-gray-50 border p-3">
                  <p className="text-xs text-gray-500 mb-1">ผู้ให้คำปรึกษา</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {consultantName}
                  </p>
                </div>
              )}

              {/* รายละเอียดเพิ่มเติม (ถ้ามี) */}
              {problemDesc && (
                <div className="sm:col-span-2 rounded-xl bg-white border p-4">
                  <p className="text-xs text-gray-500 mb-2">
                    รายละเอียดเพิ่มเติม
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                    {problemDesc}
                  </p>
                </div>
              )}

              {/* เหตุผลยกเลิก (ถ้ามี) */}
              {cancelReason && (
                <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs text-red-600 mb-2 font-semibold">
                    เหตุผลการยกเลิก
                  </p>
                  <p className="text-sm text-red-800 leading-relaxed whitespace-pre-line">
                    {cancelReason}
                  </p>
                </div>
              )}
            </div>

            {/* FOOT NOTE */}
            <div className="mt-4 text-[11px] text-gray-400">
              แตะที่การ์ดอีกครั้งเพื่อซ่อนรายละเอียด
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ======================================================
     NORMAL MODE (Active booking)
  ====================================================== */
  return (
    <Card className="overflow-hidden" padding="md">
      <div className={cn("px-4 py-2", statusConfig.bgColor)}>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-sm font-medium flex items-center gap-2",
              statusConfig.textColor
            )}
          >
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </span>
          <span className="text-xs text-gray-500">
            #{String(booking.id).padStart(6, "0")}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {hasDate && (
          <div>
            <p className="font-semibold text-gray-800">
              {formatThaiDate(new Date(booking.date!))}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Clock className="w-4 h-4" />
              {booking.startTime} – {booking.endTime} น.
            </p>
          </div>
        )}

        {booking.problemType && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">ประเภทปัญหา</p>
            <p className="text-sm text-gray-700">{booking.problemType}</p>
          </div>
        )}

        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
          >
            <XCircle className="w-4 h-4" />
            ยกเลิกการจอง
          </Button>
        )}
      </div>
    </Card>
  );
}
