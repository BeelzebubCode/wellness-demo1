// src/components/filters/inputs/DateCalendarPopover.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, X, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { MiniCalendar } from "./MiniCalendar";
import { formatDateDMY } from "../utils/date";
import { fromYMD, toYMD, normalizeYMD } from "@/lib/date";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** กัน timezone/เวลา: บังคับให้เป็น “เที่ยงวัน” เพื่อไม่ให้ข้ามวันตอนแปลงไปมา */
function atNoon(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

export function DateCalendarPopover({
  valueYMD,
  onChangeYMD,
  minDate,
  maxDate,
  disablePast,
  closeOnSelect = false,
}: {
  valueYMD?: string;
  onChangeYMD: (ymd: string) => void;
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  closeOnSelect?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // ✅ parse ค่าเข้ามาแบบรองรับ พ.ศ. และไม่เพี้ยนวัน
  const selectedDate = useMemo(() => {
    const s = String(valueYMD ?? "").trim();
    if (!s) return atNoon(new Date());

    const d = fromYMD(s); // รองรับ พ.ศ. + คืน Date local
    return Number.isNaN(d.getTime()) ? atNoon(new Date()) : atNoon(d);
  }, [valueYMD]);

  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(selectedDate));

  useEffect(() => {
    if (open) setCurrentMonth(startOfMonth(selectedDate));
  }, [open, selectedDate]);

  // click outside / esc
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ✅ label ควรใช้ค่าที่ normalize แล้ว (กัน พ.ศ.)
  const label = valueYMD ? formatDateDMY(normalizeYMD(valueYMD)) : "เลือกวันที่";
  const hasValue = !!valueYMD;

  // ✅ min/max ก็ normalize กันไว้ (เผื่อใครส่ง date ที่มีเวลาแปลก ๆ)
  const minDateSafe = useMemo(() => (minDate ? atNoon(minDate) : undefined), [minDate]);
  const maxDateSafe = useMemo(() => (maxDate ? atNoon(maxDate) : undefined), [maxDate]);

  return (
    <div ref={wrapRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex items-center gap-2 h-10 px-3.5 rounded-xl border transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400",
          open
            ? "border-primary-400 bg-primary-50/50 ring-2 ring-primary-100"
            : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300",
          hasValue ? "text-gray-900" : "text-gray-500"
        )}
      >
        <CalendarDays
          className={cn(
            "w-4 h-4 transition-colors",
            hasValue || open ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
          )}
        />
        <span className="text-sm font-medium tabular-nums">{label}</span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full left-0 mt-2 z-50",
            "w-[360px] max-w-[95vw]",
            "bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100",
            "flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-left"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/80 bg-white">
            <span className="text-sm font-semibold text-gray-700">เลือกวันที่</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            <MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                // ✅ ใช้ toYMD จาก lib (ไม่เพี้ยน + format มาตรฐาน)
                onChangeYMD(toYMD(d));
                if (closeOnSelect) setOpen(false);
              }}
              currentMonth={currentMonth}
              onPreviousMonth={() =>
                setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))
              }
              onNextMonth={() =>
                setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))
              }
              minDate={minDateSafe}
              maxDate={maxDateSafe}
              disablePast={disablePast}
            />
          </div>

          <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const t = atNoon(new Date());
                onChangeYMD(toYMD(t));
                setCurrentMonth(startOfMonth(t));
                if (closeOnSelect) setOpen(false);
              }}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 px-2 py-1.5 rounded-lg hover:bg-primary-50 transition"
            >
              กลับมาวันนี้
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 shadow-sm shadow-primary-200 transition"
            >
              <Check className="w-3.5 h-3.5" />
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
