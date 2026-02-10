// src/features/consultant/shifts/components/ShiftTimeline.tsx

import type { ConsultantShift } from "../types";

interface ShiftTimelineProps {
  shift: ConsultantShift;
}

export function ShiftTimeline({ shift }: ShiftTimelineProps) {
  const startDate = new Date(shift.startDate);
  const endDate = new Date(shift.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });

  const getDayStatus = (date: Date, dayIndex: number) => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    // Check if borrowed
    for (const bp of shift.borrowPeriods) {
      const bpStart = new Date(bp.startDate);
      const bpEnd = new Date(bp.endDate);
      bpStart.setHours(0, 0, 0, 0);
      bpEnd.setHours(0, 0, 0, 0);

      if (dateOnly >= bpStart && dateOnly <= bpEnd) {
        return bp.status === "ACTIVE" ? "borrowed-active" : "borrowed-returned";
      }
    }

    if (dateOnly < today) return "completed";
    if (dateOnly.getTime() === today.getTime()) return "current";
    return "upcoming";
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "current":
        return "bg-primary-500 ring-4 ring-primary-200 scale-110";
      case "completed":
        return "bg-green-500";
      case "borrowed-active":
        return "bg-yellow-500 ring-2 ring-yellow-300";
      case "borrowed-returned":
        return "bg-purple-500";
      case "upcoming":
        return "bg-gray-300";
      default:
        return "bg-gray-200";
    }
  };

  const progress = (shift.daysWorked / 14) * 100;

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-14 gap-1">
        {days.map((date, i) => {
          const status = getDayStatus(date, i);
          const isToday = status === "current";

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-full aspect-square rounded-full transition-all ${getStatusClasses(status)}`}
                title={date.toLocaleDateString("th-TH")}
              />
              {isToday && (
                <div className="text-[10px] font-bold text-primary-600">
                  วันนี้
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>ทำงานแล้ว</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary-500" />
          <span>วันนี้</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>ถูกยืมไป</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>คืนแล้ว</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span>ยังไม่ถึง</span>
        </div>
      </div>
    </div>
  );
}
