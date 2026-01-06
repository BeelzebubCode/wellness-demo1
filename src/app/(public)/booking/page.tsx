// ==========================================
// 📌 Booking Page (NO LINE | DEV LOGIN MODE)
// ==========================================

'use client';

import { useState } from 'react';
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

/* ==================================================
   🔐 MOCK LOGIN (DEV MODE)
   ================================================== */
const MOCK_USER = {
  userId: 'test_student_001',
  displayName: 'Test Student',
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

  /* ---------------- DATA ---------------- */
  const {
    slots,
    isLoading: isSlotsLoading,
    refetch: refetchSlots,
  } = useTimeSlots(selectedDate);

  const {
    hasActiveBooking,
    refetch: refetchAppointments,
  } = useMyAppointments(profile.userId);

  const {
    createBooking,
    isLoading: isBookingLoading,
    error: bookingError,
    clearError,
  } = useBooking();

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
    if (!selectedSlot) return;

    try {
      await createBooking({
        lineUserId: profile.userId, // ใช้เป็น userId ชั่วคราว
        timeSlotId: selectedSlot.timeSlotId,
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
              <TimeSlotGrid
                selectedDate={selectedDate}
                slots={slots}
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
