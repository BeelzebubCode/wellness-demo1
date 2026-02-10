// src/features/consultant/shifts/components/ConsultantShiftsPageClient.tsx

"use client";

import { AlertCircle, Calendar, List } from "lucide-react";
import { useState } from "react";
import { useMySchedule } from "../hooks/useMySchedule";
import { TimelineCalendar } from "./TimelineCalendar";
import { ShiftCard } from "./ShiftCard";

type ViewMode = "calendar" | "list";

export function ConsultantShiftsPageClient() {
  const { data, isLoading, error } = useMySchedule();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูลตารางเวร...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-1">
              ไม่สามารถโหลดข้อมูลได้
            </h3>
            <p className="text-red-700">
              {data?.error || "กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { currentShift, upcomingShifts, completedShifts } = data.data!;
  const allShifts = [
    ...(currentShift ? [currentShift] : []),
    ...upcomingShifts,
    ...completedShifts,
  ];

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Calendar className="h-7 w-7" />
              ตารางเวรของฉัน
            </h1>
            <p className="text-primary-100">
              ดูและจัดการตารางเวรประจำของคุณ
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "calendar"
                  ? "bg-white text-primary-600 shadow-md"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="font-medium">ปฏิทิน</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "list"
                  ? "bg-white text-primary-600 shadow-md"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <List className="h-4 w-4" />
              <span className="font-medium">รายการ</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{currentShift ? 1 : 0}</div>
            <div className="text-xs text-primary-100">เวรปัจจุบัน</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{upcomingShifts.length}</div>
            <div className="text-xs text-primary-100">กำลังจะมาถึง</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{completedShifts.length}</div>
            <div className="text-xs text-primary-100">เสร็จสิ้นแล้ว</div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "calendar" ? (
        <TimelineCalendar shifts={allShifts} />
      ) : (
        <div className="space-y-8">
          {/* Current Shift */}
          {currentShift && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-600" />
                เวรปัจจุบัน
              </h2>
              <ShiftCard shift={currentShift} variant="current" />
            </div>
          )}

          {/* Upcoming Shifts */}
          {upcomingShifts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                เวรที่กำลังจะมาถึง
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {upcomingShifts.length}
                </span>
              </h2>
              <div className="grid gap-4">
                {upcomingShifts.map((shift) => (
                  <ShiftCard key={shift.shiftId} shift={shift} variant="upcoming" />
                ))}
              </div>
            </div>
          )}

          {/* Completed Shifts */}
          {completedShifts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                ประวัติเวรที่ผ่านมา
                <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {completedShifts.length}
                </span>
              </h2>
              <div className="grid gap-4">
                {completedShifts.slice(0, 3).map((shift) => (
                  <ShiftCard key={shift.shiftId} shift={shift} variant="completed" />
                ))}
              </div>
              {completedShifts.length > 3 && (
                <button className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium hover:bg-gray-50 rounded-lg transition-colors">
                  ดูเพิ่มเติม ({completedShifts.length - 3})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* No Data */}
      {!currentShift && upcomingShifts.length === 0 && completedShifts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
          <p className="text-yellow-900 font-medium">ยังไม่มีข้อมูลตารางเวร</p>
          <p className="text-sm text-yellow-700 mt-1">
            กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดตารางเวรของคุณ
          </p>
        </div>
      )}
    </div>
  );
}
