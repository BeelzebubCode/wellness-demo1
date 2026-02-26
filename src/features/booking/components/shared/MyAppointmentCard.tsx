"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { formatThaiDate } from "@/lib/date";
import {
  BOOKING_STATUS,
  BOOKING_STATUS_FALLBACK,
  normalizeBookingStatus,
} from "@/shared/constants/booking-status";

import { Card, Button } from "@/components/ui";
import { Clock, XCircle, Star, ChevronDown, MessageSquarePlus } from "lucide-react";
import type { MyBookingDto } from "@/features/booking/types";
import { OnlineSessionPanel } from "./OnlineSessionPanel";

// Utility to derive view data from DTO
function getDisplayData(b: MyBookingDto) {
  const start = b.startAt ? new Date(b.startAt) : null;
  const end = b.endAt ? new Date(b.endAt) : null;

  return {
    id: b.bookingId,
    date: start ? start.toISOString().slice(0, 10) : null,
    dateObj: start,
    startTime: start ? start.toTimeString().slice(0, 5) : null,
    endTime: end ? end.toTimeString().slice(0, 5) : null,
    problemType: b.problemCategoryNameTh ?? null,
    hasExceptionRequest: !!(b as any).hasExceptionRequest,
  };
}

function CountdownText({ targetDate }: { targetDate: Date }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted || !now || targetDate < now) return null;

  const diffMs = targetDate.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const days = Math.floor(diffMins / (24 * 60));
  const hours = Math.floor((diffMins % (24 * 60)) / 60);
  const mins = diffMins % 60;

  let text = "";
  if (days > 0) text += `${days} วัน `;
  if (hours > 0) text += `${hours} ชม. `;
  if (mins > 0 && days === 0) text += `${mins} นาที`;

  if (!text) text = "ไม่ถึง 1 นาที";

  return (
    <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md text-[11px] border border-blue-100 whitespace-nowrap">
      อีก {text.trim()}
    </span>
  );
}

export interface MyAppointmentCardProps {
  booking: MyBookingDto;
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
  const view = getDisplayData(booking);

  const normalized = normalizeBookingStatus((booking as any).status);

  const statusConfig =
    normalized === "UNKNOWN"
      ? { ...BOOKING_STATUS_FALLBACK, label: String((booking as any).status ?? "UNKNOWN") }
      : BOOKING_STATUS[normalized];

  const StatusIcon = statusConfig.icon;
  const isCompleted = normalized === "COMPLETED";

  const hasDate = Boolean(view.dateObj && view.startTime && view.endTime);

  const hasFeedback =
    Boolean((booking as any).outcome) ||
    Boolean((booking as any).hasFeedback) ||
    Boolean((booking as any).feedbackId) ||
    Boolean((booking as any).feedbackSubmitted) ||
    (Array.isArray((booking as any).feedbacks) && (booking as any).feedbacks.length > 0);

  const showFeedbackAction = isCompleted && !hasFeedback && typeof onFeedback === "function";

  // ---------------- COMPACT (History) ----------------
  if (isCompact) {
    const fullDate = view.dateObj
      ? view.dateObj.toLocaleDateString("th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      : null;

    const bookingIdText = `#${String(view.id).padStart(6, "0")}`;

    const consultantName = booking.consultantName ?? null;
    const cancelReason = (booking as any).cancelReason ?? null;
    const problemDesc = (booking as any).problemDescription ?? (booking as any).description ?? null;

    return (
      <div
        className={cn(
          "group rounded-xl border bg-white overflow-hidden transition-all duration-200",
          "hover:shadow-md hover:border-blue-100",
          isExpanded ? "shadow-md border-blue-200 ring-1 ring-blue-100" : "",
        )}
      >
        {/* header */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggle?.()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggle?.();
          }}
          className={cn(
            "relative w-full text-left flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 transition select-none cursor-pointer",
            isExpanded ? "bg-blue-50/30" : "bg-white group-hover:bg-gray-50/50",
          )}
        >
          {/* date box */}
          {view.dateObj ? (
            <div
              className={cn(
                "shrink-0 w-[52px] flex flex-col items-center rounded-lg border bg-white overflow-hidden shadow-sm",
                isExpanded ? "border-blue-200" : "border-gray-200",
              )}
            >
              <div className="w-full bg-gray-100 text-[10px] font-medium text-gray-500 text-center py-0.5 border-b border-gray-100">
                {view.dateObj.toLocaleDateString("th-TH", { weekday: "short" })}
              </div>
              <div className="text-xl font-bold text-gray-800 py-1">{view.dateObj.getDate()}</div>
            </div>
          ) : (
            <div className="w-[52px] shrink-0" />
          )}

          {/* main */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold rounded-full px-2 py-0.5 border",
                  statusConfig.bgColor,
                  statusConfig.textColor,
                  statusConfig.borderColor,
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>

              {hasDate && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {view.startTime}-{view.endTime}
                </span>
              )}
            </div>

            <div className="font-medium text-sm text-gray-900 truncate pr-2">
              {view.problemType ?? "ไม่ระบุหัวข้อปัญหา"}
            </div>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {showFeedbackAction && (
              <Button
                size="sm"
                variant="primary"
                className="h-8 px-3 text-xs shadow-sm btn-tenant animate-in fade-in zoom-in duration-300 shrink-0"
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

            {onToggle && (
              <div
                className={cn(
                  "shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-transform duration-200 text-gray-400 hover:bg-gray-100",
                  isExpanded && "rotate-180 bg-gray-100 text-gray-600",
                )}
              >
                <ChevronDown className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        {/* expanded */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-[1400px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 sm:px-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                  Booking ID
                </p>
                <p className="text-sm font-mono text-gray-600 select-all">{bookingIdText}</p>
              </div>

              {showFeedbackAction && (
                <div className="sm:hidden text-xs text-amber-600 font-medium flex items-center animate-pulse">
                  <MessageSquarePlus className="w-3 h-3 mr-1" />
                  รอการประเมิน
                </div>
              )}
            </div>

            {/* ✅ Online session panel */}
            <OnlineSessionPanel booking={booking} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {consultantName && (
                <div className="col-span-1 sm:col-span-2 bg-white border rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">ผู้ให้คำปรึกษา</p>
                  <p className="text-sm font-semibold text-gray-800">{consultantName}</p>
                </div>
              )}

              <div className="bg-white border rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">วันที่นัดหมาย</p>
                <p className="text-sm text-gray-700">{fullDate || "-"}</p>
              </div>

              <div className="bg-white border rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">เวลา</p>
                <p className="text-sm text-gray-700">
                  {view.startTime ?? "-"} – {view.endTime ?? "-"} น.
                </p>
              </div>

              {problemDesc && (
                <div className="sm:col-span-2 bg-white border rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-2">รายละเอียดเพิ่มเติม</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {problemDesc}
                  </p>
                </div>
              )}

              {cancelReason && (
                <div className="sm:col-span-2 bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs text-red-500 font-semibold mb-1">เหตุผลการยกเลิก</p>
                  <p className="text-sm text-red-700">{cancelReason}</p>
                </div>
              )}


            </div>

            <div className="text-center">
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

  // ---------------- NORMAL (Active booking) ----------------
  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-200" padding="none">
      <div className={cn("px-4 py-3 border-b flex items-center justify-between", statusConfig.bgColor)}>
        <span className={cn("text-sm font-semibold flex items-center gap-2", statusConfig.textColor)}>
          <StatusIcon className="w-4 h-4" />
          {statusConfig.label}
        </span>
        <span className="text-xs font-mono opacity-60">#{String(view.id).padStart(6, "0")}</span>
      </div>

      <div className="p-5 space-y-4">
        {view.dateObj && view.startTime && view.endTime && (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-gray-900">{formatThaiDate(view.dateObj)}</p>
                {normalized !== "COMPLETED" && normalized !== "CANCELLED" && (
                  <CountdownText targetDate={view.dateObj} />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                เวลา {view.startTime} – {view.endTime} น.
              </p>
            </div>
          </div>
        )}

        {view.problemType ? (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">หัวข้อปัญหา</p>
            <p className="text-sm font-medium text-gray-700">{view.problemType}</p>
          </div>
        ) : null}

        {/* ✅ Online session panel (normal mode) */}
        <OnlineSessionPanel booking={booking} />

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
