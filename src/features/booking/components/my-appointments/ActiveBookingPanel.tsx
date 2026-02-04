// src/features/booking/components/my-appointments/ActiveBookingPanel.tsx

"use client";

import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { Inbox, CalendarPlus, Clock3 } from "lucide-react";

import type { MyBookingDto } from "@/features/booking/types";
import { MyAppointmentCard } from "./MyAppointmentCard";

export function ActiveBookingPanel({
  booking,
  onCancel,
}: {
  booking: MyBookingDto | null;
  onCancel: (booking: MyBookingDto) => void;
}) {
  return (
    <Card className="rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-emerald-600" />
          การจองที่กำลังดำเนินการ
        </h2>

        <Link href="/booking">
          <Button variant="outline" size="sm">
            <CalendarPlus className="w-4 h-4 mr-1" />
            จองคิวใหม่
          </Button>
        </Link>
      </div>

      {booking ? (
        <div className="space-y-3">
          <MyAppointmentCard booking={booking} onCancel={() => onCancel(booking)} />
        </div>
      ) : (
        <div className="py-12 text-center border border-dashed rounded-xl bg-gray-50">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="font-semibold text-gray-700">ไม่มีการจองที่กำลังดำเนินการ</p>
          <p className="text-sm text-gray-500 mt-1">คุณสามารถจองคิวใหม่ได้</p>
        </div>
      )}
    </Card>
  );
}
