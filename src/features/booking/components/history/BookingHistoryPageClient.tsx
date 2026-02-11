"use client";

import { useMyAppointments } from "@/features/booking/hooks/useMyAppointments";
import { MyAppointmentCard } from "@/features/booking/components/shared/MyAppointmentCard";
import { BookingFeedbackModal } from "@/features/booking/components/shared/BookingFeedbackModal";
import { Card, LoadingSpinner } from "@/components/ui";
import { History, Inbox } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { FilterBar } from "@/components/filters/FilterBar";
import {
  BOOKING_HISTORY_FILTER_DEFS,
  type BookingHistoryFilters,
} from "./filters";

function ymdToDateStart(ymd: string) {
  return new Date(`${ymd}T00:00:00`);
}
function ymdToDateEnd(ymd: string) {
  return new Date(`${ymd}T23:59:59.999`);
}

function safeDate(raw: any): Date | null {
  if (!raw) return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function BookingHistoryPageClient() {
  const { pastBookings = [], isLoading, refetch } = useMyAppointments();

  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ✅ Feedback modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackBookingId, setFeedbackBookingId] = useState<number | null>(null);

  const openFeedback = (bookingId: number) => {
    setFeedbackBookingId(bookingId);
    setFeedbackOpen(true);
  };

  const closeFeedback = () => {
    setFeedbackOpen(false);
    setFeedbackBookingId(null);
  };

  function toYMD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const [filters, setFilters] = useState<BookingHistoryFilters>({
    status: "ALL",
    search: "",
    dateFrom: toYMD(new Date()),
  });

  const filteredBookings = useMemo(() => {
    const status = filters.status ?? "ALL";
    const q = (filters.search ?? "").trim().toLowerCase();
    const from = filters.dateFrom ? ymdToDateStart(filters.dateFrom) : null;
    const to = filters.dateTo ? ymdToDateEnd(filters.dateTo) : null;

    return (pastBookings ?? []).filter((b: any) => {
      // 1) status
      if (status !== "ALL" && b.status !== status) return false;

      // 2) date range
      if (from || to) {
        const rawDate = b.date || b.startAt || b.createdAt || null;
        const d = safeDate(rawDate);
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
      }

      // 3) search
      if (q) {
        const hay = [
          b.problemCategoryNameTh,
          b.problemDescription,
          b.consultantName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [pastBookings, filters]);

  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const ITEMS_PER_PAGE = 10;
  const totalAll = pastBookings.length;
  const total = filteredBookings.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const done = filteredBookings.filter((b: any) => b.status === "COMPLETED").length;
  const cancelled = filteredBookings.filter((b: any) => b.status === "CANCELLED").length;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="xl" label="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header + Counter (Desktop) */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <History className="w-6 h-6 text-primary-600" />
            ประวัติการจอง
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            รายการจองที่เสร็จสิ้นหรือยกเลิกแล้ว
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-gray-600">
            แสดง <span className="font-semibold text-gray-900">{total}</span>{" "}
            {totalAll !== total ? (
              <span className="text-gray-500">จาก {totalAll}</span>
            ) : null}{" "}
            รายการ
          </span>
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-emerald-700">
            เสร็จสิ้น <span className="font-semibold">{done}</span>
          </span>
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-red-700">
            ยกเลิก <span className="font-semibold">{cancelled}</span>
          </span>
        </div>
      </div>

      {/* FilterBar */}
      <FilterBar
        defs={BOOKING_HISTORY_FILTER_DEFS}
        value={filters}
        onChange={setFilters}
        dateKey="dateFrom"
        searchKey="search"
        searchPlaceholder="ค้นหาเรื่อง/รายละเอียด/ผู้ให้คำปรึกษา..."
      />

      {/* Counter (Mobile) */}
      <div className="md:hidden rounded-xl border bg-white px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          แสดง <span className="font-semibold">{total}</span>
          {totalAll !== total ? (
            <span className="text-gray-500"> / {totalAll}</span>
          ) : null}
        </div>
        <div className="text-xs text-gray-500">
          เสร็จสิ้น{" "}
          <span className="font-semibold text-emerald-700">{done}</span> •
          ยกเลิก <span className="font-semibold text-red-700">{cancelled}</span>
        </div>
      </div>

      {/* List */}
      <Card className="rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <History className="w-4 h-4 text-primary-500" />
            รายการที่แสดง
          </h2>
          <div className="text-xs text-gray-500">
            {total} รายการ{totalAll !== total ? ` (จาก ${totalAll})` : ""}
          </div>
        </div>

        {filteredBookings.length > 0 ? (
          <>
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-gray-200" />
              <div className="space-y-4">
                {paginatedBookings.map((booking: any) => {
                  const isExpanded = expandedId === booking.bookingId;
                  return (
                    <div key={booking.bookingId ?? booking.id} className="relative">
                      <div className="absolute -left-[2px] top-5 h-3 w-3 rounded-full bg-primary-500 ring-4 ring-white" />
                      <MyAppointmentCard
                        booking={booking}
                        isCompact
                        isExpanded={isExpanded}
                        onToggle={() =>
                          setExpandedId(isExpanded ? null : (booking.bookingId ?? booking.id))
                        }
                        onFeedback={() => openFeedback(booking.bookingId ?? booking.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  kก่อนหน้า
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .map((p) => {
                    // Show current, first, last, and surrounding pages logic could go here
                    // specific request: tabs 1 2 3
                    if (
                      p === 1 ||
                      p === totalPages ||
                      (p >= currentPage - 1 && p <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 flex items-center justify-center text-sm rounded-md border ${
                            currentPage === p
                              ? "bg-primary-600 text-white border-primary-600"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    } else if (
                      p === currentPage - 2 ||
                      p === currentPage + 2
                    ) {
                      return <span key={p} className="text-gray-400">...</span>;
                    }
                    return null;
                  })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-xl bg-gray-50">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-semibold text-gray-700">ไม่พบรายการตามตัวกรอง</p>
            <p className="text-sm text-gray-500 mt-1">
              ลองเปลี่ยนสถานะหรือช่วงวันที่ดู
            </p>
          </div>
        )}
      </Card>

      {/* ✅ Feedback Modal */}
      <BookingFeedbackModal
        isOpen={feedbackOpen}
        bookingId={feedbackBookingId}
        onClose={closeFeedback}
        onSuccess={() => {
          // ✅ รีเฟรช list เพื่อให้ hasFeedback อัปเดต + ปุ่มหายไป
          if (typeof refetch === "function") refetch();
        }}
      />
    </div>
  );
}
