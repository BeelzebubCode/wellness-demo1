// app/booking/history/page.tsx
"use client";

import { useMyAppointments } from "@/features/booking/hooks/useMyAppointments";
import { MyAppointmentCard } from "@/components/booking";
import { Card, LoadingSpinner } from "@/components/ui";
import { History, Inbox } from "lucide-react";
import { useState } from "react";

export default function BookingHistoryPage() {
  const { pastBookings, isLoading } = useMyAppointments();
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <History className="w-6 h-6 text-primary-600" />
          ประวัติการจอง
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          รายการจองที่เสร็จสิ้นหรือยกเลิกแล้ว
        </p>
      </div>

      {/* Stats - ลบ "ไม่มา" ออก */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="ทั้งหมด"
          value={pastBookings.length}
          color="text-gray-700"
        />
        <StatCard
          label="เสร็จสิ้น"
          value={pastBookings.filter((b) => b.status === "COMPLETED").length}
          color="text-emerald-600"
        />
        <StatCard
          label="ยกเลิก"
          value={pastBookings.filter((b) => b.status === "CANCELLED").length}
          color="text-red-600"
        />
      </div>

      {/* History List */}
      <Card className="rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-primary-500" />
          รายการทั้งหมด ({pastBookings.length})
        </h2>

        {pastBookings.length > 0 ? (
          <div className="space-y-3">
            {pastBookings.map((booking) => {
              const isExpanded = expandedId === booking.id;

              return (
                <MyAppointmentCard
                  key={booking.id}
                  booking={booking}
                  isCompact
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : booking.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-xl bg-gray-50">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-semibold text-gray-700">ยังไม่มีประวัติการจอง</p>
            <p className="text-sm text-gray-500 mt-1">
              เมื่อมีการจองที่เสร็จสิ้นจะแสดงที่นี่
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

// Sub-component
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
