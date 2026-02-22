// src/features/consultant/shifts/components/ConsultantShiftsPageClient.tsx

"use client";

import { AlertCircle } from "lucide-react";
import { useMySchedule } from "../hooks/useMySchedule";
import { TimelineCalendar } from "./TimelineCalendar";

export function ConsultantShiftsPageClient() {
  const { data, isLoading, error } = useMySchedule();

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

  const { teamId, teamOrder, teamName, config, borrowShifts } = data.data!;

  if (!teamOrder || !config) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10 shadow-sm">
        <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-yellow-900 mb-2">ยังไม่ได้จัดสรรทีมเข้าเวร</h2>
        <p className="text-yellow-700">
          บัญชีของคุณยังไม่ได้ถูกเข้าร่วมในทีมเข้าเวรใดเลย (ทีม 1-4)
          กรุณาติดต่อผู้ดูแลระบบเพื่อแก้ไขข้อมูลการเข้าเวรของคุณ
        </p>
      </div>
    );
  }

  return (
    <TimelineCalendar
      teamOrder={teamOrder}
      teamName={teamName || `ทีม ${teamOrder}`}
      config={config}
      borrowShifts={borrowShifts}
    />
  );
}
