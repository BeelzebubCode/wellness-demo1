// src/features/booking/components/BookingPage.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TimeSlotCore } from "@/shared/types/timeSlot";

import { useTimeSlots } from "../hooks/useTimeSlots";
import { useBooking } from "../hooks/useBooking";

import { BookingCalendar } from "./calendar/BookingCalendar";
import { TimePeriodTabs } from "./slots/TimePeriodTabs";
import { TimeSlotGrid } from "./slots/TimeSlotGrid";
import { BookingConfirmModal } from "./modals/BookingConfirmModal";
import { BookingSuccessModal } from "./modals/BookingSuccessModal";

import type { SlotPeriod } from "../utils/slotPeriod";
import { isSlotInPeriod } from "../utils/slotPeriod";

import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { addDays } from "@/lib/date";
import { CalendarClock, Info, RotateCcw } from "lucide-react";

// helper: Date -> "YYYY-MM-DD"
function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date) {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

export function BookingPage({ universityId }: { universityId?: number }) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  const [period, setPeriod] = useState<SlotPeriod>("MORNING");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotCore | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [latestBookingId, setLatestBookingId] = useState<number | null>(null);

  // ✅ scroll ไป card เวลา (เหมือนหน้าเก่า)
  const slotsSectionRef = useRef<HTMLDivElement>(null);
  const isFirstRun = useRef(true);

  const dateStr = useMemo(() => toISODate(selectedDate), [selectedDate]);

  // ✅ ต้องดึง refetch มาด้วย
  const { slots, loading, error, refetch } = useTimeSlots(dateStr, universityId);

  const {
    submitBooking,
    loading: bookingLoading,
    error: bookingError,
  } = useBooking(universityId);

  // ✅ detect "มีคิวค้าง" จาก error ที่ได้จาก hook (ซึ่งควร map เป็นไทยแล้ว)
  const hasActiveBooking = useMemo(() => {
    const t = String(bookingError ?? "");
    return (
      t.includes("active booking") ||
      t.includes("คิวค้าง") ||
      t.includes("กำลังดำเนินการอยู่") ||
      t.includes("ไม่สามารถจองเพิ่มได้")
    );
  }, [bookingError]);

  const filtered = useMemo(() => {
    return (slots ?? []).filter((s) => isSlotInPeriod((s as any).startTime, period));
  }, [slots, period]);

  // ✅ เปลี่ยนวัน/ช่วงเวลา -> เคลียร์ slot ที่เลือกไว้
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, period]);

  // ✅ scroll ลงมาหากเลือกวันใหม่ (ข้ามครั้งแรก)
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (slotsSectionRef.current) {
      setTimeout(() => {
        slotsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [selectedDate]);

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-5xl px-4 pt-4 pb-24 space-y-4">
        {/* ✅ Rules Card (เหมือนหน้าเก่า) */}
        <Card className="rounded-2xl bg-primary-50 border border-primary-100 p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary-700 mt-1" />
            <ul className="text-sm text-primary-800 list-disc pl-4 space-y-1">
              <li>จองล่วงหน้าได้ไม่เกิน 7 วัน</li>
              <li>หากมีคิวที่ยังไม่เสร็จสิ้น จะไม่สามารถจองเพิ่มได้</li>
            </ul>
          </div>
        </Card>

        {/* ✅ Calendar + Slots (md:grid-cols-5) */}
        <section className="grid md:grid-cols-5 gap-4 items-start">
          {/* LEFT: Calendar */}
          <div className="md:col-span-2 space-y-3">
            <Card className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    ปฏิทินการจอง
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToday}
                  className={cn(
                    "text-xs px-3 py-1 border border-gray-200 rounded-full",
                    "flex items-center gap-1 text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <RotateCcw className="w-3 h-3" />
                  วันนี้
                </button>
              </div>

              <div className="p-5">
                <BookingCalendar
                  embedded
                  selectedDate={selectedDate}
                  onSelectDate={(d) => {
                    setSelectedDate(d);
                    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  }}
                  currentMonth={currentMonth}
                  onPreviousMonth={handlePreviousMonth}
                  onNextMonth={handleNextMonth}
                  minDate={startOfDay(new Date())}
                  maxDate={startOfDay(addDays(new Date(), 7))}
                />
              </div>
            </Card>
          </div>

          {/* RIGHT: Slots */}
          <div className="md:col-span-3 space-y-4">
            <Card
              ref={slotsSectionRef}
              className="rounded-2xl bg-white shadow-sm overflow-hidden scroll-mt-20"
            >
              {/* Tabs */}
              <div className="px-5 py-4 border-b border-gray-100">
                <TimePeriodTabs value={period} onChange={setPeriod} />
              </div>

              <div className="p-5 pt-4">
                {/* ✅ แถบเตือนคิวค้างบนหน้า (เห็นชัด ไม่เงียบ) */}
                {hasActiveBooking ? (
                  <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    คุณมีการจองที่กำลังดำเนินการอยู่ (คิวค้าง) กรุณารอให้เสร็จสิ้นหรือยกเลิกก่อนจองใหม่
                  </div>
                ) : null}

                <TimeSlotGrid
                  embedded
                  selectedDate={selectedDate}
                  slots={filtered}
                  isLoading={loading}
                  hasActiveBooking={hasActiveBooking}
                  onSelectSlot={(s) => {
                    if (hasActiveBooking) return; // ✅ กันคลิก
                    setSelectedSlot(s);
                    setConfirmOpen(true);
                  }}
                />

                {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
              </div>
            </Card>
          </div>
        </section>

        {/* Modals */}
        <BookingConfirmModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          slot={selectedSlot}
          isLoading={bookingLoading}
          error={bookingError}
          onSubmit={async (payload) => {
            try {
              const res = await submitBooking(payload);

              // ✅ จองสำเร็จ -> รีเฟรช slot ทันที
              if (res && res.success === true) {
                await refetch();
                setLatestBookingId(res.bookingId);
                setConfirmOpen(false);
                setSuccessOpen(true);
              }
            } catch (e) {
              // ✅ จองไม่สำเร็จ (เช่น 409 มีคิวค้าง/slot เต็ม) -> รีเฟรชไว้ด้วย
              // เพื่อให้ UI แสดงสถานะ slot ล่าสุด
              await refetch();
              // ไม่ต้องปิด modal ก็ได้ เพราะ BookingConfirmModal จะแสดง error อยู่แล้ว
            }
          }}
        />

        <BookingSuccessModal
          isOpen={successOpen}
          onClose={() => setSuccessOpen(false)}
          onViewAppointments={() => {
            setSuccessOpen(false);
          }}
        />
      </main>
    </div>
  );
}
