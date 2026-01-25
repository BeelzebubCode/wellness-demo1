// src/components/booking/MyBookingHistory.tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { ClipboardList } from "lucide-react";

import { MyAppointmentCard } from "@/components/booking/MyAppointmentCard";
import { BookingFeedbackModal } from "@/components/booking/BookingFeedbackModal";

import type { Booking, MyBooking } from "@/features/booking/types";

interface MyBookingHistoryProps {
  bookings: Booking[];
  onRefresh?: () => void;
}

export function MyBookingHistory({ bookings, onRefresh }: MyBookingHistoryProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackBookingId, setFeedbackBookingId] = useState<number | null>(null);

  return (
    <Card className="rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary-600" />
            ประวัติการจอง
          </h2>
          <p className="text-xs text-gray-500 mt-1">ทั้งหมด {bookings.length} รายการ</p>
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const isExpanded = expandedId === booking.id;

            // ✅ แปลง Booking -> MyBooking (กัน undefined -> null)
            const myBooking: MyBooking = {
              id: booking.id,
              status: booking.status,
              problemType: booking.problemType ?? null,

              createdAt: booking.createdAt ?? null,
              updatedAt: booking.updatedAt ?? null,

              date: booking.date ?? null,
              startTime: booking.startTime ?? null,
              endTime: booking.endTime ?? null,

              hasFeedback: booking.hasFeedback,
            };

            return (
              <MyAppointmentCard
                key={booking.id}
                booking={myBooking} // ✅ ส่ง type ที่ถูกต้อง
                isCompact
                isExpanded={isExpanded}
                onToggle={() => setExpandedId(isExpanded ? null : booking.id)}
                onFeedback={() => {
                  setFeedbackBookingId(booking.id);
                  setFeedbackOpen(true);
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 text-sm py-10 bg-gray-50 border border-dashed rounded-xl">
          ยังไม่มีประวัติการจอง
        </div>
      )}

      <BookingFeedbackModal
        isOpen={feedbackOpen}
        bookingId={feedbackBookingId}
        onClose={() => {
          setFeedbackOpen(false);
          setFeedbackBookingId(null);
        }}
        onSuccess={() => {
          onRefresh?.();
        }}
      />
    </Card>
  );
}

export default MyBookingHistory;
