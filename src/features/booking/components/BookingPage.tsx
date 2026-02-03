"use client";

import { useMemo, useState } from "react";
import type { TimeSlot } from "../types";
import { useTimeSlots } from "../hooks/useTimeSlots";
import { useBooking } from "../hooks/useBooking";
import { BookingCalendar } from "./calendar/BookingCalendar";
import { TimePeriodTabs } from "./slots/TimePeriodTabs";
import { TimeSlotGrid } from "./slots/TimeSlotGrid";
import { BookingConfirmModal } from "./modals/BookingConfirmModal";
import { BookingSuccessModal } from "./modals/BookingSuccessModal";

export function BookingPage({ universityId }: { universityId?: number }) {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState<"MORNING" | "AFTERNOON" | "EVENING">("MORNING");

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [latestBookingId, setLatestBookingId] = useState<number | null>(null);

  const { slots, loading, error } = useTimeSlots(date, universityId);
  const { submitBooking, loading: bookingLoading, error: bookingError } = useBooking(universityId);

  const filtered = useMemo(() => {
    // ✅ ของเดิมน่าจะมี logic แยกช่วงเวลาอยู่แล้วใน TimePeriodTabs/slotPeriod utils
    // ตรงนี้ให้ใช้แบบง่ายก่อน (เดี๋ยวค่อยผูก slotPeriod.ts)
    return slots;
  }, [slots, period]);

  return (
    <div className="flex flex-col gap-4">
      <BookingCalendar value={date} onChange={setDate} />

      <TimePeriodTabs value={period} onChange={setPeriod} />

      <TimeSlotGrid
        slots={filtered}
        loading={loading}
        error={error}
        onSelect={(s) => {
          setSelectedSlot(s);
          setConfirmOpen(true);
        }}
      />

      <BookingConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        slot={selectedSlot}
        isLoading={bookingLoading}
        error={bookingError}
        onSubmit={async (payload) => {
          const res = await submitBooking(payload);
          if (res.success) {
            setLatestBookingId(res.bookingId);
            setConfirmOpen(false);
            setSuccessOpen(true);
          }
        }}
      />

      <BookingSuccessModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        bookingId={latestBookingId ?? undefined}
      />
    </div>
  );
}
