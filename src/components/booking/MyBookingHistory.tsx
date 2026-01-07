'use client';

import { Card } from '@/components/ui';
import { ClipboardList } from 'lucide-react';
import { MyAppointmentCard } from '@/components/booking';
import type { Booking } from '@/features/booking/types';

interface MyBookingHistoryProps {
  bookings: Booking[];
}

export function MyBookingHistory({ bookings }: MyBookingHistoryProps) {
  return (
    <Card className="rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <ClipboardList className="w-4 h-4 text-primary-500" />
        ประวัติการจอง ({bookings.length})
      </h2>

      {bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <MyAppointmentCard
              key={booking.id}
              booking={booking}
              isCompact
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 text-sm py-6 bg-gray-50 border border-dashed rounded-xl">
          ยังไม่มีประวัติการจอง
        </div>
      )}
    </Card>
  );
}
