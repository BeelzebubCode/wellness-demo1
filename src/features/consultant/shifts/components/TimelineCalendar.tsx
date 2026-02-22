"use client";

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Briefcase, CalendarCheck, CalendarOff, Activity } from "lucide-react";
import { useMemo, useState } from "react";
import type { BorrowShift, ShiftCycleConfig } from "../types";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui";

interface TimelineCalendarProps {
  teamOrder: number;
  teamName: string;
  config: ShiftCycleConfig;
  borrowShifts: BorrowShift[];
}

function dateToKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const thaiMonths = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
const weekDays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export function TimelineCalendar({ teamOrder, teamName, config, borrowShifts }: TimelineCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  // Algorithmic Shift Calculation
  const isDateOnDuty = (date: Date) => {
    const epoch = new Date(config.epochDate);
    epoch.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - epoch.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return false; // Before epoch is not handled

    const phase = diffDays % config.cycleDays;
    const startPhase = (teamOrder - 1) * config.teamLengthDays;
    const endPhase = startPhase + (config.teamLengthDays - 1);

    return phase >= startPhase && phase <= endPhase;
  };

  // Find the next duty start date
  const computeNextDuty = () => {
    const cursor = new Date(today);
    let count = 0;
    while (count < 100) {
      if (isDateOnDuty(cursor)) return cursor;
      cursor.setDate(cursor.getDate() + 1);
      count++;
    }
    return null;
  };

  const nextDutyDate = useMemo(computeNextDuty, [today, config, teamOrder]);
  const isCurrentlyOnDuty = isDateOnDuty(today);

  // Map borrow shifts
  const borrowMap = useMemo(() => {
    const map = new Map<string, BorrowShift[]>();
    for (const shift of borrowShifts) {
      if (shift.status === 'CANCELLED') continue;
      const start = parseYMD(shift.startDate);
      const end = parseYMD(shift.endDate);
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = dateToKey(cursor);
        const existing = map.get(key) || [];
        existing.push(shift);
        map.set(key, existing);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [borrowShifts]);

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

  return (
    <div className="max-w-[1200px] mx-auto p-4 space-y-6">

      {/* Dynamic Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Main Status Card */}
        <div className={cn(
          "col-span-1 md:col-span-2 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl transition-all duration-700",
          isCurrentlyOnDuty ? "bg-gradient-to-br from-indigo-600 via-primary-600 to-blue-500" : "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800"
        )}>
          {/* Decorative background vectors */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-black opacity-10 blur-3xl"></div>

          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 font-semibold tracking-widest text-sm uppercase mb-1 drop-shadow-sm">รอบเข้าเวรปัจจุบัน</p>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl md:text-5xl font-black drop-shadow-md">{teamName}</h1>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-md",
                    isCurrentlyOnDuty ? "bg-green-400/20 text-green-100 border border-green-400/30" : "bg-slate-400/20 text-slate-200 border border-slate-400/30"
                  )}>
                    {isCurrentlyOnDuty ? <Activity className="w-4 h-4" /> : <CalendarOff className="w-4 h-4" />}
                    {isCurrentlyOnDuty ? "กำลังอยู่ในช่วงเข้าเวร" : "อยู่นอกรอบเข้าเวร"}
                  </span>
                </div>
              </div>

              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-xl border border-white/20",
                isCurrentlyOnDuty ? "bg-white/20" : "bg-white/10"
              )}>
                <CalendarIcon className="w-8 h-8 text-white drop-shadow-md" />
              </div>
            </div>

            <div className="mt-8">
              {isCurrentlyOnDuty ? (
                <p className="text-lg text-white/90 font-medium">คุณอยู่ในรอบเวร <span className="font-bold underline decoration-white/40 underline-offset-4">14 วัน</span> โปรดเตรียมพร้อมสำหรับการให้คำปรึกษา</p>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-lg text-white/90 font-medium">
                    พักผ่อนให้เต็มที่! รอบเวรถัดไปของคุณจะเริ่มในวันที่ <span className="font-bold border-b border-white/40 pb-0.5">{nextDutyDate ? `${nextDutyDate.getDate()} ${thaiMonths[nextDutyDate.getMonth()]} ${nextDutyDate.getFullYear() + 543}` : "-"}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend & Stats Sidebar */}
        <Card className="col-span-1 rounded-[2rem] p-6 shadow-xl border-white bg-white/60 backdrop-blur-2xl flex flex-col justify-center">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> สัญลักษณ์บนปฏิทิน
          </h3>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center shrink-0">
                <span className="w-3 h-3 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">เข้าเวรปกติ</p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">ช่วงเวลา 14 วันที่คุณต้องแสตนด์บาย</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-amber-500 drop-shadow-sm" />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">ถูกยืมตัวพิเศษ</p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">การปฏิบัติหน้าที่กรณีถูกร้องขอข้ามมหาลัย</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Modern Calendar Section */}
      <Card className="rounded-[2.5rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-white overflow-hidden pb-8">

        {/* Controls */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                {thaiMonths[month]} <span className="font-light text-slate-400">{year + 543}</span>
              </h2>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95 shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 px-8 pt-6 pb-2">
          {weekDays.map((day, i) => (
            <div key={day} className={cn("text-center text-[11px] font-black uppercase tracking-widest", (i === 0 || i === 6) ? "text-rose-400" : "text-slate-400")}>
              {day}
            </div>
          ))}
        </div>

        {/* Grid Engine */}
        <div className="px-8">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-3 mb-3">
              {week.map((date, colIndex) => {
                if (!date) {
                  return <div key={colIndex} className="h-28 rounded-2xl bg-transparent" />;
                }

                const key = dateToKey(date);
                const isToday = isSameDay(date, today);
                const onDuty = isDateOnDuty(date);
                const borrows = borrowMap.get(key) || [];
                const isSelected = selectedDate === key;

                // Active borrows are those that are not completed
                const activeBorrows = borrows.filter(b => b.status === "ACTIVE");
                const hasActiveBorrow = activeBorrows.length > 0;

                let cellClass = "bg-slate-50/50 border-slate-100 hover:border-slate-300";
                if (onDuty) {
                  cellClass = "bg-primary-50/50 border-primary-200/60 ring-1 ring-inset ring-primary-50 hover:bg-primary-50";
                }
                if (hasActiveBorrow) {
                  cellClass = "bg-amber-50/70 border-amber-200 hover:bg-amber-50 ring-1 ring-inset ring-transparent";
                }

                return (
                  <div
                    key={colIndex}
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={cn(
                      "group h-28 rounded-2xl border p-3 flex flex-col transition-all cursor-pointer relative overflow-hidden",
                      cellClass,
                      isToday && "ring-2 ring-primary border-transparent shadow-lg shadow-primary/20",
                      isSelected && "scale-95 ring-4 ring-slate-200 z-10"
                    )}
                  >
                    {/* Top Section */}
                    <span className={cn(
                      "text-sm font-black transition-colors w-8 h-8 flex items-center justify-center rounded-xl",
                      isToday ? "bg-primary text-white" : onDuty ? "text-primary-700 bg-white shadow-sm" : hasActiveBorrow ? "text-amber-700 bg-white shadow-sm" : "text-slate-400"
                    )}>
                      {date.getDate()}
                    </span>

                    {/* Indicators Area */}
                    <div className="mt-auto space-y-1">
                      {onDuty && !hasActiveBorrow && (
                        <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-primary-400 to-indigo-400 group-hover:h-2 transition-all"></div>
                      )}
                      {hasActiveBorrow && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-amber-100 shadow-sm">
                          <Briefcase className="w-3 h-3 text-amber-500" />
                          <span className="text-[9px] font-bold text-amber-700 truncate">ถูกยืมตัว</span>
                        </div>
                      )}
                      {borrows.filter(b => b.status === "COMPLETED").length > 0 && !hasActiveBorrow && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 opacity-50">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span className="text-[9px] font-bold text-slate-500">เสร็จสิ้นยืมตัว</span>
                        </div>
                      )}
                    </div>

                    {/* Interactive Background Glow on Duty */}
                    {onDuty && <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary-200/20 blur-xl rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* Selected Action Panel */}
      {selectedDate && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
          <Card className="rounded-[2rem] p-6 shadow-2xl border-white bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5">
                <span className="text-xl font-black">{parseYMD(selectedDate).getDate()}</span>
              </div>
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">
                  รายละเอียดวันที่เลือก
                </p>
                <h3 className="text-lg font-bold">
                  {parseYMD(selectedDate).toLocaleDateString("th-TH", { weekday: "long", month: "long", year: "numeric" })}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {isDateOnDuty(parseYMD(selectedDate)) ? (
                <div className="px-5 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 font-bold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  อยู่ในช่วงเตรียมความพร้อม 14 วัน
                </div>
              ) : (
                <div className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-sm">
                  อยู่นอกรอบเข้าเวร
                </div>
              )}

              {(borrowMap.get(selectedDate) || []).map((b, idx) => (
                <div key={idx} className="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-sm flex flex-col">
                  <span className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4" /> ภารกิจยืมตัวข้ามมหาวิทยาลัย
                  </span>
                  <span className="text-amber-400/80 text-xs font-normal">
                    ให้คำปรึกษากับ {b.targetUniversity.nameTh}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Utils
function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}
