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

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const thaiMonths = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
    "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
  ];

  const weekDays = ["อา","จ","อ","พ","พฤ","ศ","ส"];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

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
  today.setHours(0,0,0,0);

  return (
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

      {/* Week Header */}
      <div className="grid grid-cols-7 px-6 pt-4 pb-2 text-sm font-medium text-gray-500">
        {weekDays.map((day) => (
          <div key={day} className="text-center">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="px-6 pb-6">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-3 mb-3">
            {week.map((date, colIndex) => {
              const isToday =
                date &&
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate();

              return (
                <div
                  key={colIndex}
                  className={`
                    h-24 rounded-2xl border flex items-start justify-start p-3
                    transition-all duration-200
                    ${date 
                      ? "bg-gray-50 border-gray-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                      : "bg-transparent border-transparent"}
                    ${isToday ? "ring-2 ring-primary-500 bg-primary-50" : ""}
                  `}
                >
                  {date && (
                    <span className={`text-sm font-semibold ${isToday ? "text-primary-700" : "text-gray-700"}`}>
                      {date.getDate()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
