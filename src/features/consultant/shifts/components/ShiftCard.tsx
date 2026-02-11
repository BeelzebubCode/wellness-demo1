import { Calendar, MapPin } from "lucide-react";
import type { ConsultantShift } from "../types";
import { ShiftTimeline } from "./ShiftTimeline";

interface ShiftCardProps {
  shift: ConsultantShift;
  variant?: "current" | "upcoming" | "completed";
}

export function ShiftCard({ shift, variant = "current" }: ShiftCardProps) {

  const cardStyle =
    variant === "current"
      ? "border-primary-300 bg-primary-50"
      : "border-gray-200 bg-white";

  return (
    <div className={`rounded-xl border p-5 ${cardStyle} shadow-sm`}>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            {new Date(shift.startDate).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </h3>

          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {shift.homeUniversity.nameTh}
          </p>
        </div>

        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
          {shift.status}
        </span>
      </div>

      {variant === "current" && (
        <div className="mb-4">
          <ShiftTimeline shift={shift} />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div>
          <div className="font-bold text-primary-600">
            {shift.daysWorked}
          </div>
          <div className="text-gray-500">ทำแล้ว</div>
        </div>

        <div>
          <div className="font-bold text-blue-600">
            {shift.daysRemaining}
          </div>
          <div className="text-gray-500">เหลือ</div>
        </div>

        <div>
          <div className="font-bold text-gray-700">
            {shift.daysWorked + shift.daysRemaining}
          </div>
          <div className="text-gray-500">รวม</div>
        </div>
      </div>
    </div>
  );
}
