// src/features/consultant/shifts/components/ShiftCard.tsx

import { Calendar, MapPin, Clock, AlertCircle } from "lucide-react";
import type { ConsultantShift } from "../types";
import { ShiftTimeline } from "./ShiftTimeline";
import { BorrowPeriodBadge } from "./BorrowPeriodBadge";

interface ShiftCardProps {
  shift: ConsultantShift;
  variant?: "current" | "upcoming" | "completed";
}

export function ShiftCard({ shift, variant = "current" }: ShiftCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "ON_LOAN":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "กำลังปฏิบัติงาน";
      case "ON_LOAN":
        return "ถูกยืมไป";
      case "COMPLETED":
        return "เสร็จสิ้น";
      case "CANCELLED":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  const cardClasses = {
    current: "border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white shadow-lg",
    upcoming: "border border-blue-200 bg-gradient-to-br from-blue-50 to-white",
    completed: "border border-gray-200 bg-white opacity-75",
  };

  const activeBorrow = shift.borrowPeriods.find(bp => bp.status === "ACTIVE");

  return (
    <div className={`rounded-2xl p-6 ${cardClasses[variant]} transition-all hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              เวรประจำ {new Date(shift.startDate).toLocaleDateString("th-TH", { 
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{shift.homeUniversity.nameTh}</span>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(shift.status)}`}>
          {getStatusText(shift.status)}
        </span>
      </div>

      {/* Timeline (for current shift only) */}
      {variant === "current" && (
        <div className="mb-6">
          <ShiftTimeline shift={shift} />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary-600">{shift.daysWorked}</div>
          <div className="text-xs text-gray-600">วันที่ทำงานแล้ว</div>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{shift.daysRemaining}</div>
          <div className="text-xs text-gray-600">วันที่เหลือ</div>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">14</div>
          <div className="text-xs text-gray-600">วันทั้งหมด</div>
        </div>
      </div>

      {/* Active Borrow Period Alert */}
      {activeBorrow && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-yellow-900 mb-1">
                กำลังถูกยืมไป
              </div>
              <div className="text-sm text-yellow-800">
                ยืมไป: <span className="font-medium">{activeBorrow.borrowedToUniversity.nameTh}</span>
              </div>
              <div className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(activeBorrow.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })} - {" "}
                {new Date(activeBorrow.endDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Borrow Periods */}
      {shift.borrowPeriods.length > 0 && !activeBorrow && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 mb-2">
            ประวัติการยืม ({shift.borrowPeriods.length})
          </div>
          {shift.borrowPeriods.map((bp) => (
            <BorrowPeriodBadge key={bp.periodId} borrowPeriod={bp} />
          ))}
        </div>
      )}

      {/* Date Range */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-600">
          <div>
            <span className="font-medium">เริ่ม:</span> {" "}
            {new Date(shift.startDate).toLocaleDateString("th-TH", { 
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </div>
          <div>
            <span className="font-medium">สิ้นสุด:</span> {" "}
            {new Date(shift.endDate).toLocaleDateString("th-TH", { 
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
