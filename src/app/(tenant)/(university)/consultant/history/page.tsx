// src/app/(tenant)/(university)/consultant/history/page.tsx
"use client";

import { useState } from "react";
import { Card, LoadingSpinner } from "@/components/ui";
import { History, Inbox } from "lucide-react";
import { MyAppointmentCard } from "@/components/booking";

import type { MyBooking } from "@/features/booking/types";

const mockPastConsultations: MyBooking[] = [
  {
    id: 1001,
    status: "COMPLETED",
    problemType: "ปัญหาการเรียน",

    createdAt: "2026-01-09T09:00:00.000Z",
    updatedAt: "2026-01-09T11:05:00.000Z",

    date: "2026-01-09",
    startTime: "10:00",
    endTime: "11:00",

    // ใส่เพิ่มได้ถ้าใช้
    hasFeedback: false,
  },
  {
    id: 1002,
    status: "COMPLETED",
    problemType: "การวางแผนอาชีพ",

    createdAt: "2026-01-08T12:00:00.000Z",
    updatedAt: "2026-01-08T14:10:00.000Z",

    date: "2026-01-08",
    startTime: "13:00",
    endTime: "14:00",

    hasFeedback: true,
  },
];

export default function ConsultantHistoryPage() {
  const pastBookings = mockPastConsultations;
  const isLoading = false;

  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="xl" label="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <History className="w-6 h-6 text-primary-600" />
          ประวัติการให้คำปรึกษา
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          รายการนัดหมายที่ให้คำปรึกษาเสร็จสิ้นแล้ว
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="ทั้งหมด" value={pastBookings.length} color="text-gray-700" />
        <StatCard
          label="เสร็จสิ้น"
          value={pastBookings.filter((b) => b.status === "COMPLETED").length}
          color="text-emerald-600"
        />
      </div>

      <Card className="rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-primary-500" />
          รายการทั้งหมด ({pastBookings.length})
        </h2>

        {pastBookings.length > 0 ? (
          <div className="relative pl-6">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-gray-200" />

            <div className="space-y-4">
              {pastBookings.map((booking) => {
                const isExpanded = expandedId === booking.id;

                return (
                  <div key={booking.id} className="relative">
                    <div className="absolute -left-[2px] top-5 h-3 w-3 rounded-full bg-primary-500 ring-4 ring-white" />

                    <MyAppointmentCard
                      booking={booking}
                      isCompact
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedId(isExpanded ? null : booking.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-xl bg-gray-50">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-semibold text-gray-700">ยังไม่มีประวัติการให้คำปรึกษา</p>
            <p className="text-sm text-gray-500 mt-1">
              เมื่อมีการให้คำปรึกษาเสร็จสิ้นจะแสดงที่นี่
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="rounded-xl p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}
