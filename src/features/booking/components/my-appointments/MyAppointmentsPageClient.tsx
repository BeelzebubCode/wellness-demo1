// src/features/booking/components/my-appointments/MyAppointmentsPageClient.tsx

"use client";

import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import { AlertBox } from "@/components/notification/AlertBox";
import { LoadingSpinner } from "@/components/ui";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

import { useMyAppointments } from "@/features/booking/hooks/useMyAppointments";
import { useBooking } from "@/features/booking/hooks/useBooking";
import type { MyBookingDto } from "@/features/booking/types";

import { ActiveBookingPanel } from "./ActiveBookingPanel";
import { BookingSummaryPanel } from "./BookingSummaryPanel";
import { CancelBookingModal } from "./CancelBookingModal";

function isActiveStatus(status: string) {
  return status !== "COMPLETED" && status !== "CANCELLED";
}

export default function MyAppointmentsPageClient() {
  const [bookingToCancel, setBookingToCancel] = useState<MyBookingDto | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const openCancel = (booking: MyBookingDto) => {
    setBookingToCancel(booking);
    setCancelReason("");
    setCancelError(null);
    setHasSubmitted(false);
    setShowCancelModal(true);
  };

  const { push } = useNotificationContext();
  const { items, loading, error, refetch } = useMyAppointments();
  const { cancelBooking, isCancelling } = useBooking();

  const vm = useMemo(() => {
    const list = Array.isArray(items) ? items : [];

    const active = list.find((b) => isActiveStatus(String((b as any).status))) ?? null;
    const past = list.filter((b) => b !== active);

    const activeCount = active ? 1 : 0;

    const completedCount = list.filter((b) => String((b as any).status) === "COMPLETED").length;
    const cancelledCount = list.filter((b) => String((b as any).status) === "CANCELLED").length;

    return {
      activeBooking: active,
      pastBookings: past,
      totalCount: list.length,
      activeCount,
      completedCount,
      cancelledCount,
    };
  }, [items]);

  const onConfirmCancel = async () => {
    setHasSubmitted(true);
    if (!bookingToCancel) return;

    if (!cancelReason.trim()) {
      setCancelError("กรุณากรอกเหตุผลในการยกเลิก");
      return;
    }

    try {
      await cancelBooking({
        bookingId: bookingToCancel.bookingId,
        universityId: bookingToCancel.universityId,
        reason: cancelReason,
      });

      setShowCancelModal(false);
      setBookingToCancel(null);
      setCancelReason("");
      setCancelError(null);
      setHasSubmitted(false);

      push({
        type: "success",
        title: "ยกเลิกสำเร็จ",
        message: "ยกเลิกนัดหมายเรียบร้อยแล้ว",
        duration: 3000,
      });

      await refetch(); // ✅ ไม่ reload หน้า
    } catch {
      setCancelError("ไม่สามารถยกเลิกการจองได้ กรุณาลองใหม่");
    }
  };

  if (loading || isCancelling) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="xl" label="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary-600" />
          ตารางนัดของฉัน
        </h1>
        <p className="text-sm text-gray-500 mt-1">ดูการจองที่กำลังดำเนินการ</p>
      </div>

      {error ? <AlertBox type="error" message={error} /> : null}

      {/* ✅ layout ใหม่: บน-ล่าง */}
      <div className="space-y-6">
        {/* TOP: Summary chart */}
        <BookingSummaryPanel
          totalCount={vm.totalCount}
          activeCount={vm.activeCount}
          completedCount={vm.completedCount}
          cancelledCount={vm.cancelledCount}
        />

        {/* BOTTOM: Active booking full width */}
        <ActiveBookingPanel booking={vm.activeBooking} onCancel={openCancel} />
      </div>

      <CancelBookingModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        reason={cancelReason}
        onChangeReason={(v) => {
          setCancelReason(v);
          setCancelError(null);
          setHasSubmitted(false);
        }}
        error={cancelError}
        hasSubmitted={hasSubmitted}
        onConfirm={onConfirmCancel}
        isLoading={isCancelling}
      />
    </div>
  );
}
