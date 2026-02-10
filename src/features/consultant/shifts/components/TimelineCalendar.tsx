// src/features/consultant/shifts/components/TimelineCalendar.tsx

"use client";

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { ConsultantShift } from "../types";

interface TimelineCalendarProps {
  shifts: ConsultantShift[];
}

export function TimelineCalendar({ shifts }: TimelineCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Thai month names
  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const weekDays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar grid (weeks)
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Fill first week with empty cells
  for (let i = 0; i < startingDayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Add all days
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(new Date(year, month, day));

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill last week with empty cells
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // Calculate shift bar positions
  const getShiftBars = () => {
    const bars: Array<{
      shift: ConsultantShift;
      weekIndex: number;
      startCol: number;
      span: number;
      type: "shift" | "borrowed";
      borrowPeriod?: any;
    }> = [];

    weeks.forEach((week, weekIndex) => {
      // For each shift, see if it overlaps this week
      shifts.forEach(shift => {
        const shiftStart = new Date(shift.startDate);
        const shiftEnd = new Date(shift.endDate);
        shiftStart.setHours(0, 0, 0, 0);
        shiftEnd.setHours(0, 0, 0, 0);

        const weekStart = week.find(d => d !== null);
        const weekEnd = week[week.length - 1];
        if (!weekStart || !weekEnd) return;

        const weekStartDate = new Date(weekStart);
        const weekEndDate = new Date(weekEnd);
        weekStartDate.setHours(0, 0, 0, 0);
        weekEndDate.setHours(0, 0, 0, 0);

        // Check if shift overlaps this week
        if (shiftStart <= weekEndDate && shiftEnd >= weekStartDate) {
          // Calculate which columns this bar should span
          const barStart = shiftStart < weekStartDate ? weekStartDate : shiftStart;
          const barEnd = shiftEnd > weekEndDate ? weekEndDate : shiftEnd;

          let startCol = 0;
          let span = 0;

          week.forEach((date, col) => {
            if (!date) return;
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);

            if (d >= barStart && d <= barEnd) {
              if (span === 0) startCol = col;
              span++;
            }
          });

          if (span > 0) {
            bars.push({
              shift,
              weekIndex,
              startCol,
              span,
              type: "shift",
            });
          }

          // Check for borrow periods in this shift
          shift.borrowPeriods.forEach(bp => {
            const bpStart = new Date(bp.startDate);
            const bpEnd = new Date(bp.endDate);
            bpStart.setHours(0, 0, 0, 0);
            bpEnd.setHours(0, 0, 0, 0);

            if (bpStart <= weekEndDate && bpEnd >= weekStartDate) {
              const borrowBarStart = bpStart < weekStartDate ? weekStartDate : bpStart;
              const borrowBarEnd = bpEnd > weekEndDate ? weekEndDate : bpEnd;

              let borrowStartCol = 0;
              let borrowSpan = 0;

              week.forEach((date, col) => {
                if (!date) return;
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);

                if (d >= borrowBarStart && d <= borrowBarEnd) {
                  if (borrowSpan === 0) borrowStartCol = col;
                  borrowSpan++;
                }
              });

              if (borrowSpan > 0) {
                bars.push({
                  shift,
                  weekIndex,
                  startCol: borrowStartCol,
                  span: borrowSpan,
                  type: "borrowed",
                  borrowPeriod: bp,
                });
              }
            }
          });
        }
      });
    });

    return bars;
  };

  const shiftBars = getShiftBars();

  const getBarColor = (bar: any) => {
    if (bar.type === "borrowed") {
      if (bar.borrowPeriod.status === "ACTIVE") {
        return "bg-gradient-to-r from-yellow-400 to-yellow-500 border-yellow-600 shadow-lg shadow-yellow-200";
      }
      return "bg-gradient-to-r from-purple-400 to-purple-500 border-purple-600 shadow-lg shadow-purple-200";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftEnd = new Date(bar.shift.endDate);
    shiftEnd.setHours(0, 0, 0, 0);

    if (bar.shift.status === "COMPLETED" || shiftEnd < today) {
      return "bg-gradient-to-r from-gray-300 to-gray-400 border-gray-500 shadow-lg shadow-gray-200";
    }

    if (bar.shift.status === "ACTIVE" || bar.shift.status === "ON_LOAN") {
      const shiftStart = new Date(bar.shift.startDate);
      shiftStart.setHours(0, 0, 0, 0);
      
      if (shiftStart <= today && shiftEnd >= today) {
        return "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-700 shadow-xl shadow-blue-300 ring-2 ring-blue-400";
      }
      return "bg-gradient-to-r from-blue-400 to-blue-500 border-blue-600 shadow-lg shadow-blue-200";
    }

    return "bg-gradient-to-r from-green-400 to-green-500 border-green-600 shadow-lg shadow-green-200";
  };

  const getBarLabel = (bar: any) => {
    if (bar.type === "borrowed") {
      return `ยืมไป: ${bar.borrowPeriod.borrowedToUniversity.nameTh}`;
    }
    return bar.shift.homeUniversity.nameTh;
  };

  const getStatusBadge = (bar: any) => {
    if (bar.type === "borrowed") {
      if (bar.borrowPeriod.status === "ACTIVE") {
        return { label: "ถูกยืม", color: "bg-yellow-600" };
      }
      return { label: "คืนแล้ว", color: "bg-purple-600" };
    }

    if (bar.shift.status === "ACTIVE") {
      return { label: "กำลังปฏิบัติ", color: "bg-blue-700" };
    }
    if (bar.shift.status === "COMPLETED") {
      return { label: "เสร็จสิ้น", color: "bg-gray-600" };
    }
    return { label: bar.shift.status, color: "bg-gray-600" };
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <CalendarIcon className="h-6 w-6" />
              <h2 className="text-2xl font-bold">
                {thaiMonths[month]} {year + 543}
              </h2>
            </div>
          </div>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs justify-center">
          <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>เวรปัจจุบัน</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span>ถูกยืมไป</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full">
            <div className="w-3 h-3 rounded-full bg-purple-400" />
            <span>คืนแล้ว</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>เสร็จสิ้น</span>
          </div>
        </div>
      </div>

      {/* Calendar Timeline Grid */}
      <div className="p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="text-center font-bold text-gray-700 py-2 text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Timeline rows */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="relative mb-3">
            {/* Date cells (background) */}
            <div className="grid grid-cols-7 gap-2">
              {week.map((date, colIndex) => (
                <div
                  key={colIndex}
                  className={`
                    h-20 rounded-lg border flex items-start justify-center pt-2
                    ${date ? "bg-gray-50 border-gray-200 text-gray-700" : "bg-transparent border-transparent"}
                  `}
                >
                  {date && (
                    <span className="text-sm font-medium">{date.getDate()}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Shift bars overlay */}
            <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
              <div className="grid grid-cols-7 gap-2 h-full">
                {week.map((_, colIndex) => (
                  <div key={colIndex} className="relative">
                    {shiftBars
                      .filter(bar => bar.weekIndex === weekIndex && bar.startCol === colIndex)
                      .map((bar, barIndex) => {
                        const badge = getStatusBadge(bar);
                        return (
                          <div
                            key={barIndex}
                            className={`
                              absolute top-7 h-11 rounded-lg border-2
                              flex items-center justify-center px-2 text-white font-medium text-xs
                              pointer-events-auto cursor-pointer
                              transition-transform hover:scale-105 hover:z-10
                              ${getBarColor(bar)}
                            `}
                            style={{
                              width: `calc(${bar.span * 100}% + ${(bar.span - 1) * 8}px)`,
                              left: 0,
                            }}
                            title={`${getBarLabel(bar)} (${new Date(bar.shift.startDate).toLocaleDateString("th-TH")} - ${new Date(bar.shift.endDate).toLocaleDateString("th-TH")})`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badge.color}`}>
                                {badge.label}
                              </span>
                              <span className="truncate">{getBarLabel(bar)}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
