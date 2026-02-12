"use client";

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Briefcase } from "lucide-react";
import { useMemo, useState } from "react";
import type { ConsultantShift, ShiftBorrowPeriod } from "../types";

interface TimelineCalendarProps {
  shifts: ConsultantShift[];
}

type DayInfo = {
  shift: ConsultantShift;
  type: "home" | "borrowed";
  borrowPeriod?: ShiftBorrowPeriod;
};

function dateToKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const statusLabel: Record<string, string> = {
  ACTIVE: "กำลังทำงาน",
  ON_LOAN: "ถูกยืมตัว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  ON_LOAN: "bg-amber-500",
  COMPLETED: "bg-slate-400",
  CANCELLED: "bg-red-400",
};

export function TimelineCalendar({ shifts }: TimelineCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const weekDays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  // Build a map: dateKey -> DayInfo[]
  const dayMap = useMemo(() => {
    const map = new Map<string, DayInfo[]>();

    for (const shift of shifts) {
      const start = parseYMD(shift.startDate);
      const end = parseYMD(shift.endDate);

      // Build set of borrowed date keys
      const borrowedDates = new Set<string>();
      const borrowByDate = new Map<string, ShiftBorrowPeriod>();

      for (const bp of shift.borrowPeriods) {
        if (bp.status === "CANCELLED") continue;
        const bpStart = parseYMD(bp.startDate);
        const bpEnd = parseYMD(bp.endDate);
        const cursor = new Date(bpStart);
        while (cursor <= bpEnd) {
          const key = dateToKey(cursor);
          borrowedDates.add(key);
          borrowByDate.set(key, bp);
          cursor.setDate(cursor.getDate() + 1);
        }
      }

      // Iterate each day within this shift
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = dateToKey(cursor);
        const isBorrowed = borrowedDates.has(key);

        const info: DayInfo = {
          shift,
          type: isBorrowed ? "borrowed" : "home",
          borrowPeriod: isBorrowed ? borrowByDate.get(key) : undefined,
        };

        const existing = map.get(key) || [];
        existing.push(info);
        map.set(key, existing);

        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return map;
  }, [shifts]);

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  for (let i = 0; i < startingDayOfWeek; i++) currentWeek.push(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Selected date info
  const selectedInfo = selectedDate ? dayMap.get(selectedDate) || [] : [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              {thaiMonths[month]} {year + 543}
            </h2>
          </div>

          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 pt-4 pb-2 flex flex-wrap gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            ประจำการ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            ถูกยืมตัว
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-400" />
            เสร็จสิ้น
          </span>
        </div>

        {/* Week Header */}
        <div className="grid grid-cols-7 px-6 pt-2 pb-2 text-sm font-medium text-gray-500">
          {weekDays.map((day) => (
            <div key={day} className="text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="px-6 pb-6">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2 mb-2">
              {week.map((date, colIndex) => {
                if (!date) {
                  return <div key={colIndex} className="h-20" />;
                }

                const key = dateToKey(date);
                const infos = dayMap.get(key) || [];
                const isToday =
                  date.getFullYear() === today.getFullYear() &&
                  date.getMonth() === today.getMonth() &&
                  date.getDate() === today.getDate();
                const isSelected = selectedDate === key;
                const hasShift = infos.length > 0;

                // Determine dominant type for background
                const hasBorrow = infos.some((i) => i.type === "borrowed");
                const hasHome = infos.some((i) => i.type === "home");
                const isCompleted = infos.length > 0 && infos.every((i) => i.shift.status === "COMPLETED");

                let cellBg = "bg-gray-50 border-gray-200";
                if (hasShift) {
                  if (isCompleted) {
                    cellBg = "bg-slate-100 border-slate-300";
                  } else if (hasBorrow) {
                    cellBg = "bg-amber-50 border-amber-300";
                  } else if (hasHome) {
                    cellBg = "bg-emerald-50 border-emerald-300";
                  }
                }

                return (
                  <div
                    key={colIndex}
                    onClick={() => hasShift && setSelectedDate(isSelected ? null : key)}
                    className={`
                      h-20 rounded-xl border flex flex-col items-start p-2
                      transition-all duration-200
                      ${cellBg}
                      ${hasShift ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""}
                      ${isToday ? "ring-2 ring-primary-500" : ""}
                      ${isSelected ? "ring-2 ring-primary-600 shadow-lg" : ""}
                    `}
                  >
                    <span
                      className={`text-sm font-semibold ${isToday ? "text-primary-700" : hasShift ? "text-gray-800" : "text-gray-400"
                        }`}
                    >
                      {date.getDate()}
                    </span>

                    {/* Shift indicators */}
                    {hasShift && (
                      <div className="mt-auto flex flex-wrap gap-1">
                        {hasBorrow && !isCompleted && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-200 text-amber-800">
                            <Briefcase className="w-2.5 h-2.5" />
                            ยืม
                          </span>
                        )}
                        {hasHome && !hasBorrow && !isCompleted && (
                          <span className="inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200 text-emerald-800">
                            เวร
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">
                            เสร็จ
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Date Detail Panel */}
      {selectedDate && selectedInfo.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary-600" />
            {(() => {
              const d = parseYMD(selectedDate);
              return d.toLocaleDateString("th-TH", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
            })()}
          </h3>

          <div className="space-y-3">
            {selectedInfo.map((info, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 ${info.type === "borrowed"
                    ? "border-amber-200 bg-amber-50"
                    : info.shift.status === "COMPLETED"
                      ? "border-slate-200 bg-slate-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${statusColor[info.shift.status] || "bg-gray-400"}`} />
                      <span className="text-sm font-bold text-gray-900">
                        {info.type === "borrowed" ? "ถูกยืมตัว" : "ประจำการ"}
                      </span>
                      <span className="text-xs text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
                        {statusLabel[info.shift.status] || info.shift.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">เวร:</span>{" "}
                        {parseYMD(info.shift.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                        {" - "}
                        {parseYMD(info.shift.endDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p>
                        <span className="font-medium">มหาวิทยาลัย:</span>{" "}
                        {info.shift.homeUniversity.nameTh}
                      </p>
                      {info.borrowPeriod && (
                        <p>
                          <span className="font-medium">ยืมไป:</span>{" "}
                          {info.borrowPeriod.borrowedToUniversity.nameTh}
                          {" ("}
                          {parseYMD(info.borrowPeriod.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                          {" - "}
                          {parseYMD(info.borrowPeriod.endDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                          {")"}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">ทำแล้ว:</span> {info.shift.daysWorked} วัน
                        {" • "}
                        <span className="font-medium">เหลือ:</span> {info.shift.daysRemaining} วัน
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
