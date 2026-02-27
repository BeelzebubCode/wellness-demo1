// src/components/filters/inputs/DateCalendarPopover.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, X, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { MiniCalendar } from "./MiniCalendar";
import { formatDateDMY } from "../utils/date";
import { fromYMD, toYMD, normalizeYMD, isPast } from "@/lib/date";

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
  placeholder,
  align = "left",
  formatLabel,
  className,
  variant = "default",
}: {
  valueYMD?: string;
  onChangeYMD: (ymd: string) => void;
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  closeOnSelect?: boolean;
  placeholder?: string;
  align?: "left" | "right";
  formatLabel?: (ymd: string) => string;
  className?: string;
  variant?: "default" | "compact";
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // ... (rest of logic) ...

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
  // ถ้ามี formatLabel ให้ใช้ก่อน
  const label = valueYMD
    ? formatLabel
      ? formatLabel(normalizeYMD(valueYMD))
      : formatDateDMY(normalizeYMD(valueYMD))
    : placeholder || "เลือกวันที่";
  const hasValue = !!valueYMD;

  // ✅ min/max ก็ normalize กันไว้ (เผื่อใครส่ง date ที่มีเวลาแปลก ๆ)
  const minDateSafe = useMemo(() => (minDate ? atNoon(minDate) : undefined), [minDate]);
  const maxDateSafe = useMemo(() => (maxDate ? atNoon(maxDate) : undefined), [maxDate]);

  return (
    <div ref={wrapRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disablePast && !!valueYMD && isPast(fromYMD(valueYMD))}
        className={cn(
          "group flex items-center transition-all w-full border",
          variant === "compact"
            ? cn(
              "gap-2 h-7 px-2.5 rounded-lg duration-150 text-[11px]",
              "focus:outline-none focus:ring-2 focus:ring-amber-200",
              open
                ? "bg-white border-amber-300"
                : "bg-white border-gray-200 hover:border-amber-300",
            )
            : cn(
              "gap-3 h-11 px-4 rounded-2xl duration-300",
              "focus:outline-none focus:ring-4 focus:ring-primary/10",
              open
                ? "bg-white border-primary/40 shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.4)] shadow-lg shadow-primary/5"
                : "bg-white border-slate-200 hover:border-primary/30 hover:bg-slate-50/50 shadow-sm",
            ),
          hasValue ? "text-slate-900" : "text-slate-400"
        )}
      >
        <CalendarDays
          className={cn(
            "transition-colors",
            variant === "compact"
              ? cn("w-3.5 h-3.5", hasValue || open ? "text-amber-500" : "text-gray-400")
              : cn("w-4 h-4 duration-300", hasValue || open ? "text-primary" : "text-slate-400 group-hover:text-primary/70")
          )}
        />
        <span className={cn(
          "tracking-tight tabular-nums",
          variant === "compact" ? "text-[11px] font-medium" : "text-sm font-bold"
        )}>{label}</span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-2 z-[100]",
            align === "right" ? "right-0" : "left-0",
            variant === "compact"
              ? "w-[260px] max-w-[95vw] bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top"
              : cn(
                "w-[340px] max-w-[95vw]",
                "bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100",
                "flex flex-col overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-300 origin-top"
              )
          )}
        >
          <div className={variant === "compact" ? "p-3" : "p-6"}>
            <MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={(d) => {
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
              onJumpToMonth={(d) => setCurrentMonth(d)}
              minDate={minDateSafe}
              maxDate={maxDateSafe}
              disablePast={disablePast}
              compact={variant === "compact"}
            />
          </div>

          <div className={cn(
            "flex items-center justify-between gap-2 border-t",
            variant === "compact"
              ? "px-3 py-2 bg-gray-50 border-gray-100"
              : "px-6 py-5 bg-slate-50 border-slate-100"
          )}>
            <button
              type="button"
              onClick={() => {
                onChangeYMD("");
                if (closeOnSelect) setOpen(false);
              }}
              className={cn(
                "font-semibold hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150",
                variant === "compact"
                  ? "px-2 py-1 text-[10px] text-gray-400"
                  : "px-4 py-2 text-xs text-slate-400 rounded-xl uppercase tracking-wider font-bold"
              )}
            >
              ล้าง
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const t = atNoon(new Date());
                  onChangeYMD(toYMD(t));
                  setCurrentMonth(startOfMonth(t));
                  if (closeOnSelect) setOpen(false);
                }}
                className={cn(
                  "font-semibold text-primary hover:bg-primary/10 rounded-lg transition-all duration-150",
                  variant === "compact"
                    ? "px-2 py-1 text-[10px]"
                    : "px-4 py-2 text-xs rounded-xl uppercase tracking-wider font-bold"
                )}
              >
                วันนี้
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  "bg-primary text-white font-bold shadow-sm hover:shadow-md transition-all duration-150 active:scale-95",
                  variant === "compact"
                    ? "px-3 py-1 text-[10px] rounded-lg"
                    : "px-6 py-2.5 text-xs rounded-2xl shadow-lg shadow-primary/20 font-black"
                )}
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

