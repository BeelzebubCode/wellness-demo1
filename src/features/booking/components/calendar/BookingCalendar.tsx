"use client";

import { cn } from "@/lib/cn";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(d: Date, min?: Date, max?: Date) {
  const x = startOfDay(d).getTime();
  const mn = min ? startOfDay(min).getTime() : null;
  const mx = max ? startOfDay(max).getTime() : null;
  if (mn !== null && x < mn) return false;
  if (mx !== null && x > mx) return false;
  return true;
}

function daysInMonth(year: number, month0: number) {
  return new Date(year, month0 + 1, 0).getDate();
}

function monthLabelTH(d: Date) {
  const months = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export function BookingCalendar({
  selectedDate,
  onSelectDate,
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  minDate,
  maxDate,
}: {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;

  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;

  minDate?: Date;
  maxDate?: Date;
}) {
  const y = currentMonth.getFullYear();
  const m = currentMonth.getMonth();
  const totalDays = daysInMonth(y, m);

  // 0 = Sunday ... 6 = Saturday
  const firstDay = new Date(y, m, 1).getDay();
  const padStart = firstDay; // number of empty cells at beginning

  const cells: Array<{ date: Date | null }> = [];

  for (let i = 0; i < padStart; i++) cells.push({ date: null });

  for (let day = 1; day <= totalDays; day++) {
    cells.push({ date: new Date(y, m, day) });
  }

  const weekdays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPreviousMonth}
          className="rounded-full border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          ◀
        </button>

        <div className="text-sm font-semibold text-gray-800">
          {monthLabelTH(currentMonth)}
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-full border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
        {weekdays.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, idx) => {
          if (!c.date) return <div key={idx} className="h-10" />;

          const d = c.date;
          const allowed = isInRange(d, minDate, maxDate);
          const selected = isSameDay(d, selectedDate);

          return (
            <button
              key={idx}
              type="button"
              disabled={!allowed}
              onClick={() => {
                if (!allowed) return;
                onSelectDate(d);
              }}
              className={cn(
                "h-10 rounded-xl border text-sm transition",
                allowed
                  ? "border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:bg-primary-50/40"
                  : "border-transparent bg-transparent text-gray-300 cursor-not-allowed",
                selected && allowed && "border-primary-500 bg-primary-50 text-primary-800",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
