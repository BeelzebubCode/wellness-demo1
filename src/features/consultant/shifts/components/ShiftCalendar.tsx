// src/features/consultant/shifts/components/ShiftCalendar.tsx

"use client";

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { ConsultantShift } from "../types";

interface ShiftCalendarProps {
  shifts: ConsultantShift[];
}

export function ShiftCalendar({ shifts }: ShiftCalendarProps) {
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

  // Check if a date has a shift
  const getShiftForDate = (date: Date) => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    for (const shift of shifts) {
      const shiftStart = new Date(shift.startDate);
      const shiftEnd = new Date(shift.endDate);
      shiftStart.setHours(0, 0, 0, 0);
      shiftEnd.setHours(0, 0, 0, 0);

      if (dateOnly >= shiftStart && dateOnly <= shiftEnd) {
        // Check if this date is borrowed
        const borrowPeriod = shift.borrowPeriods.find(bp => {
          const bpStart = new Date(bp.startDate);
          const bpEnd = new Date(bp.endDate);
          bpStart.setHours(0, 0, 0, 0);
          bpEnd.setHours(0, 0, 0, 0);
          return dateOnly >= bpStart && dateOnly <= bpEnd;
        });

        return { shift, borrowPeriod };
      }
    }
    return null;
  };

  const getDayClasses = (date: Date) => {
    const shiftInfo = getShiftForDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const isToday = dateOnly.getTime() === today.getTime();

    if (!shiftInfo) {
      return isToday
        ? "bg-gray-100 border-2 border-primary-500 text-gray-900"
        : "text-gray-400 hover:bg-gray-50";
    }

    const { shift, borrowPeriod } = shiftInfo;

    // Borrowed period styling
    if (borrowPeriod) {
      if (borrowPeriod.status === "ACTIVE") {
        return "bg-yellow-400 text-yellow-900 font-semibold";
      } else if (borrowPeriod.status === "RETURNED") {
        return "bg-purple-400 text-purple-900 font-medium";
      }
    }

    // Regular shift styling
    if (shift.status === "ACTIVE" || shift.status === "ON_LOAN") {
      if (dateOnly < today) {
        return "bg-green-400 text-green-900 font-medium"; // Completed days
      } else if (isToday) {
        return "bg-primary-500 text-white font-bold ring-4 ring-primary-300"; // Today
      } else {
        return "bg-blue-400 text-blue-900 font-medium"; // Upcoming days
      }
    }

    if (shift.status === "COMPLETED") {
      return "bg-gray-300 text-gray-700";
    }

    return "hover:bg-gray-50";
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
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
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span>ทำงานแล้ว</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <span>วันนี้</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span>กำลังจะมาถึง</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span>ถูกยืมไป</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-purple-400" />
            <span>คืนแล้ว</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="text-center font-semibold text-gray-700 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const shiftInfo = getShiftForDate(date);

            return (
              <div
                key={index}
                className={`
                  aspect-square rounded-lg flex items-center justify-center
                  text-sm transition-all cursor-pointer
                  ${getDayClasses(date)}
                `}
                title={
                  shiftInfo
                    ? `เวร: ${shiftInfo.shift.homeUniversity.nameTh}${
                        shiftInfo.borrowPeriod
                          ? ` - ยืมไป: ${shiftInfo.borrowPeriod.borrowedToUniversity.nameTh}`
                          : ""
                      }`
                    : undefined
                }
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
