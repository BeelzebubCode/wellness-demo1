"use client";

import { Card } from "@/components/ui";
import { ClipboardList } from "lucide-react";
import { MyAppointmentCard } from "@/components/booking";
import type { Booking } from "@/features/booking/types";
import { useState } from "react";

interface MyBookingHistoryProps {
  bookings: Booking[];
}

export function MyBookingHistory({ bookings }: MyBookingHistoryProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <Card className="rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary-600" />
            ประวัติการจอง
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            ทั้งหมด {bookings.length} รายการ
          </p>
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((booking) => {
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
        <div className="text-center text-gray-500 text-sm py-10 bg-gray-50 border border-dashed rounded-xl">
          ยังไม่มีประวัติการจอง
        </div>
      )}
    </Card>
  );
}
