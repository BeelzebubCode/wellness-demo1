// app/booking/my-appointments/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyAppointments } from "@/features/booking/hooks/useMyAppointments";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { MyAppointmentCard } from "@/components/booking";
import { AlertBox } from "@/components/notification/AlertBox";
import { Card, Button, LoadingSpinner, Modal, ModalFooter } from "@/components/ui";
import { ClipboardList, Clock3, Inbox, CalendarPlus, History } from "lucide-react";

export default function MyAppointmentsPage() {
  /* ---------------- STATE (CANCEL) ---------------- */
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleCancelClick = (bookingId: number) => {
    setBookingToCancel(bookingId);
    setCancelReason("");
    setCancelError(null);
    setShowCancelModal(true);
  };

  /* ---------------- DATA ---------------- */
  const { activeBooking, pastBookings, isLoading, refetch } = useMyAppointments();
  const { cancelBooking, isLoading: isCancelling } = useBooking();

  /* ---------------- ACTION ---------------- */
  const handleConfirmCancel = async () => {
    setHasSubmitted(true);

    if (!cancelReason.trim()) {
      setCancelError("กรุณากรอกเหตุผลในการยกเลิก");
      return;
    }

    try {
      await cancelBooking(String(bookingToCancel), cancelReason);
      setShowCancelModal(false);
      setBookingToCancel(null);
      setCancelReason("");
      setCancelError(null);
      setHasSubmitted(false);
      refetch();
    } catch {
      setCancelError("ไม่สามารถยกเลิกการจองได้ กรุณาลองใหม่");
    }
  };

  /* ---------------- DATA LOADING ---------------- */
  if (isLoading || isCancelling) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="xl" label="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* TITLE */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary-600" />
          ตารางนัดของฉัน
        </h1>
        <p className="text-sm text-gray-500 mt-1">ดูการจองที่กำลังดำเนินการ</p>
      </div>

      {/* ACTIVE + SUMMARY */}
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
              <div className="py-12 text-center border border-dashed rounded-xl bg-gray-50">
                <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="font-semibold text-gray-700">ไม่มีการจองที่กำลังดำเนินการ</p>
                <p className="text-sm text-gray-500 mt-1">คุณสามารถจองคิวใหม่ได้</p>
              </div>
            )}
          </Card>
        </div>

        {/* SUMMARY */}
        <div className="space-y-4">
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
              <div className="flex justify-between text-gray-600">
                <span>ประวัติการจอง</span>
                <span className="font-semibold text-gray-800">{pastBookings.length} รายการ</span>
              </div>
            </div>
          </Card>

          <Link href="/booking/history">
            <Card className="rounded-2xl p-4 shadow-sm hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium text-gray-700">
                    ดูประวัติการจองทั้งหมด
                  </span>
                </div>
                <span className="text-xs text-gray-500">{pastBookings.length} รายการ →</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* CANCEL MODAL */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="ยืนยันการยกเลิก"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">คุณแน่ใจหรือไม่ที่จะยกเลิกการจองนี้?</p>

          <textarea
            value={cancelReason}
            onChange={(e) => {
              setCancelReason(e.target.value);
              setCancelError(null);
              setHasSubmitted(false);
            }}
            placeholder="เหตุผล (จำเป็น)"
            rows={3}
            className={`
              w-full p-3 rounded-xl text-sm transition border
              ${
                cancelError && hasSubmitted
                  ? "border-red-400 bg-red-50 focus:ring-red-300"
                  : "border-gray-300 focus:border-primary-500 focus:ring-primary-300"
              }
              focus:outline-none focus:ring-2
            `}
          />

          {cancelError && <AlertBox type="error" message={cancelError} />}
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel}>
            ยืนยันยกเลิกการจอง
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
