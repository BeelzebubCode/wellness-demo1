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
     ✅ COMPACT MODE (History)
  ====================================================== */
  if (isCompact) {
    return (
      <div
        className={cn(
          "relative rounded-xl border bg-white overflow-hidden transition-all",
          "hover:shadow-sm"
        )}
      >
        {/* LEFT ACCENT BAR (status color) */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-1",
            statusConfig.bgColor.replace("bg-", "bg-opacity-80 bg-")
          )}
        />

        {/* ROW */}
        <button
          type="button"
          onClick={() => onToggle?.()}
          className={cn(
            "w-full text-left flex gap-4 px-5 py-4 transition",
            "hover:bg-gray-50",
            isExpanded && "bg-gray-50"
          )}
        >
          {/* DATE */}
          {booking.date && (
            <div
              className={cn(
                "flex flex-col items-center justify-center w-14 shrink-0 rounded-lg",
                "bg-white border shadow-sm"
              )}
            >
              <span className="text-[11px] font-medium text-gray-500">
                {new Date(booking.date).toLocaleDateString("th-TH", {
                  weekday: "short",
                })}
              </span>
              <span className="text-xl font-bold text-gray-800 leading-tight">
                {new Date(booking.date).getDate()}
              </span>
            </div>
          )}

          {/* MAIN INFO */}
          <div className="flex-1 min-w-0">
            {/* STATUS + ID */}
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 border",
                  statusConfig.bgColor,
                  statusConfig.textColor,
                  statusConfig.borderColor
                )}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>

              <span className="text-[11px] text-gray-400 shrink-0">
                #{String(booking.id).padStart(6, "0")}
              </span>
            </div>

            {/* TIME */}
            {hasDate && (
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {booking.startTime} – {booking.endTime} น.
              </div>
            )}

            {/* PROBLEM TYPE */}
            {booking.problemType && (
              <div className="mt-1 text-sm font-medium text-gray-700 truncate">
                {booking.problemType}
              </div>
            )}
          </div>
        </button>

        {/* EXPANDED DETAIL */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="bg-gray-50/70 border-t px-6 py-5 text-sm text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                {booking.date && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">วันที่</p>
                    <p className="font-medium">
                      {new Date(booking.date).toLocaleDateString("th-TH", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {hasDate && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">ช่วงเวลา</p>
                    <p className="font-medium">
                      {booking.startTime} – {booking.endTime} น.
                    </p>
                  </div>
                )}

                {booking.problemType && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">ประเภทปัญหา</p>
                    <p className="font-medium">{booking.problemType}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-400">
                รหัสการจอง #{String(booking.id).padStart(6, "0")}
              </div>
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
