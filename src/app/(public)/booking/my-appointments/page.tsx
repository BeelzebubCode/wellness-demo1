'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMyAppointments } from '@/features/booking/hooks/useMyAppointments';
import { useBooking } from '@/features/booking/hooks/useBooking';
import { MyAppointmentCard } from '@/components/booking';
import { MyBookingHistory } from '@/components/booking/MyBookingHistory';
import {
  Card,
  Button,
  LoadingSpinner,
  Modal,
  ModalFooter,
} from '@/components/ui';

import {
  ClipboardList,
  Clock3,
  UserRound,
  Inbox,
  CalendarPlus,
  History,
} from 'lucide-react';

/* ==================================================
   🔐 DEV LOGIN (NO LINE)
   ================================================== */
const MOCK_USER = {
  username: 'student1',
  displayName: 'Student 1',
};

export default function MyAppointmentsPage() {
  /* ---------------- AUTH ---------------- */
  const profile = MOCK_USER;
  const isLoggedIn = true;

  /* ---------------- STATE (CANCEL) ---------------- */
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCancelClick = (bookingId: number) => {
    setBookingToCancel(bookingId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  /* ---------------- DATA ---------------- */
  const {
    activeBooking,
    pastBookings,
    isLoading,
    refetch,
  } = useMyAppointments();

  const { cancelBooking, isLoading: isCancelling } = useBooking();

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    try {
      await cancelBooking(String(bookingToCancel), cancelReason || undefined);
      setShowCancelModal(false);
      setBookingToCancel(null);
      refetch();
    } catch {
      // handled in hook
    }
  };

  /* ---------------- LOADING ---------------- */
  if (isLoading || isCancelling) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="xl" label="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  /* ---------------- NOT LOGIN ---------------- */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <Card className="max-w-md w-full text-center py-10 rounded-2xl">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-primary-500" />
          <h2 className="text-xl font-bold text-gray-800">
            กรุณาเข้าสู่ระบบ
          </h2>
        </Card>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="bg-gray-50 min-h-screen pb-16 pt-10">
      {/* TITLE */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary-600" />
          ตารางนัดของฉัน
        </h1>
      </div>

      {/* ACTIVE + SUMMARY */}
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ACTIVE BOOKING */}
          <div className="lg:col-span-2">
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

              {activeBooking ? (
                <MyAppointmentCard
                  booking={activeBooking}
                  onCancel={() => handleCancelClick(activeBooking.id)}
                />
              ) : (
                <div className="py-12 text-center border border-dashed rounded-xl bg-white">
                  <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="font-semibold text-gray-700">
                    ไม่มีการจองที่กำลังดำเนินการ
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* SUMMARY */}
          <div>
            <Card className="rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-primary-500" />
                สรุปการใช้งาน
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>จำนวนการจองทั้งหมด</span>
                  <span className="font-semibold text-gray-800">
                    {pastBookings.length + (activeBooking ? 1 : 0)} รายการ
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 pt-3 border-t text-xs text-gray-500">
                <UserRound className="w-4 h-4" />
                {profile.displayName}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* HISTORY (แก้ layout ตรงนี้) */}
      <div className="max-w-5xl mx-auto px-4 mt-10">
        <MyBookingHistory bookings={pastBookings} />
      </div>

      {/* CANCEL MODAL */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="ยืนยันการยกเลิก"
        size="sm"
      >
        <div className="space-y-4">
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="เหตุผล (ไม่บังคับ)"
            className="w-full p-3 border rounded-xl text-sm"
            rows={3}
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel}>
            ยืนยัน
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
