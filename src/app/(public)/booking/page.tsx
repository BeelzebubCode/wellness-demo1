// ==========================================
// 📌 Booking Page (NO LINE | DEV LOGIN MODE)
// ==========================================

'use client';

import {
  BookingCalendar,
  TimeSlotGrid,
  BookingConfirmModal,
  BookingSuccessModal,
} from '@/components/booking';
import { useTimeSlots } from '@/features/booking/hooks/useTimeSlots';
import { useMyAppointments } from '@/features/booking/hooks/useMyAppointments';
import { useBooking } from '@/features/booking/hooks/useBooking';
import { Button, Card, LoadingSpinner } from '@/components/ui';
import { addDays } from '@/lib/date';
import type { TimeSlot } from '@/features/booking/types';
import type { BookingFormData } from '@/components/booking/BookingForm';
import Link from 'next/link';
import {
  CalendarClock,
  Info,
  RotateCcw,
  UserRound,
} from 'lucide-react';
import { ImageCard } from '@/components/ui/ImageCard';
import { TimePeriodTabs, TimePeriod } from '@/components/booking/TimePeriodTabs';
import { useState, useMemo, useEffect } from 'react';

/* ==================================================
   🔐 MOCK LOGIN (DEV MODE)
   ================================================== */
const MOCK_USER = {
  username: 'student1',   
  displayName: 'Student 1',
};

export default function BookingPage() {
  /* ---------------- AUTH ---------------- */
  const profile = MOCK_USER;
  const isLoggedIn = true;

  /* ---------------- STATE ---------------- */
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('morning');

  const filterSlotsByPeriod = (
    slots: TimeSlot[],
    period: TimePeriod,
  ) => {
    return slots.filter((slot) => {
      const hour = Number(slot.startTime.split(':')[0]);

      if (period === 'morning') return hour >= 8 && hour < 12;
      if (period === 'afternoon') return hour >= 12 && hour < 17;
      if (period === 'evening') return hour >= 17 && hour < 20;

      return true;
    });
  };

  /* ---------------- DATA ---------------- */
  const {
    slots,
    isLoading: isSlotsLoading,
    refetch: refetchSlots,
  } = useTimeSlots(selectedDate);

  const {
    hasActiveBooking,
    refetch: refetchAppointments,
  } = useMyAppointments(profile.username); // ✅ ใช้ username

  const {
    createBooking,
    isLoading: isBookingLoading,
    error: bookingError,
    clearError,
  } = useBooking();


  // filter slots by selectedPeriod
  const filteredSlots = useMemo(() => {
    return filterSlotsByPeriod(
      slots ?? [],
      selectedPeriod,
    );
  }, [slots, selectedPeriod]);

  /* ---------------- HANDLERS ---------------- */
  const handlePreviousMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    if (hasActiveBooking) {
      alert('คุณมีคิวที่ยังไม่เสร็จสิ้น กรุณายกเลิกคิวเดิมก่อน');
      return;
    }
    if (!slot.isAvailable) return;

    setSelectedSlot(slot);
    clearError();
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBooking = async (formData: BookingFormData) => {
    if (!selectedSlot?.id) {
      alert('กรุณาเลือกช่วงเวลาที่ต้องการจอง');
      return;
    }

    // 🔴 ใส่ log ตรงนี้
    console.log('📦 BOOKING PAYLOAD', {
      studentCode: profile.username,
      timeSlotId: selectedSlot.id,
      problemCategoryId: formData.problemCategoryId,
      detailText: formData.problemDescription,
    });


    try {
      await createBooking({
        studentCode: profile.username,          // ✅ account_username
        timeSlotId: selectedSlot.id,
        problemCategoryId: formData.problemCategoryId,
        detailText: formData.problemDescription,
      });

      setIsConfirmModalOpen(false);
      setSelectedSlot(null);
      setIsSuccessModalOpen(true);
      refetchSlots();
      refetchAppointments();
    } catch {
      // handled in hook
    }
  };

  const startOfDay = (d: Date) => {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
  };

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, selectedPeriod]);

  /* ==================================================
     📱 UI
     ================================================== */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label="กรุณาเข้าสู่ระบบ" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 pt-4 pb-24 space-y-4">

        {/* Greeting */}
        <Card className="rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <UserRound className="w-5 h-5 text-primary-500" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                สวัสดี, {profile.displayName}
              </p>
              <p className="text-xs text-gray-500">
                เลือกวันและช่วงเวลาที่ต้องการจอง
              </p>
            </div>
          </div>
        </Card>

        {/* Rules */}
        <Card className="rounded-2xl bg-primary-50 border border-primary-100">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary-700 mt-1" />
            <ul className="text-sm text-primary-800 list-disc pl-4 space-y-1">
              <li>จองล่วงหน้าได้ไม่เกิน 7 วัน</li>
              <li>หากมีคิวที่ยังไม่เสร็จสิ้น จะไม่สามารถจองเพิ่มได้</li>
            </ul>
          </div>
        </Card>

        {/* Calendar + Slots */}
        <section className="grid md:grid-cols-5 gap-4">
          <div className="md:col-span-2 space-y-3">
            <Card className="rounded-2xl bg-white shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-semibold">
                    ปฏิทินการจอง
                  </span>
                </div>
                <button
                  onClick={handleToday}
                  className="text-xs px-3 py-1 border rounded-full flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> วันนี้
                </button>
              </div>

              <BookingCalendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                currentMonth={currentMonth}
                onPreviousMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
                minDate={startOfDay(new Date())}
                maxDate={startOfDay(addDays(new Date(), 7))}
              />
            </Card>

            <Card>
              <Link href="https://www.facebook.com/Happyhome2563">
                <ImageCard src="/images/profiles.jpg" height={180} />
              </Link>
            </Card>
          </div>

          <div className="md:col-span-3 space-y-4">
            <Card className="rounded-2xl bg-white shadow-sm">

              {/* 🔹 เมนูเลือกช่วงเวลา */}
              <TimePeriodTabs
                value={selectedPeriod}
                onChange={setSelectedPeriod}
              />

              {/* 🔹 TimeSlot */}
              <TimeSlotGrid
                selectedDate={selectedDate}
                slots={filteredSlots}
                onSelectSlot={handleSelectSlot}
                isLoading={isSlotsLoading}
                hasActiveBooking={hasActiveBooking}
              />
            </Card>
          </div>
        </section>
      </main>

      {/* Modals */}
      <BookingConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        slot={selectedSlot}
        selectedDate={selectedDate}
        onConfirm={handleConfirmBooking}
        isLoading={isBookingLoading}
        error={bookingError}
      />

      <BookingSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onViewAppointments={() => {
          window.location.href = '/booking/my-appointments';
        }}
      />
    </div>
  );
}
