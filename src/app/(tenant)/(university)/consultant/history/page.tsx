"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Card, LoadingSpinner } from "@/components/ui";
import { History, Inbox } from "lucide-react";
import { MyAppointmentCard } from "@/features/booking/components/shared/MyAppointmentCard";

import type { MyBookingDto } from "@/features/booking/types";

export default function ConsultantHistoryPage() {
  const [bookings, setBookings] = useState<MyBookingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const bookingIdFromQuery = searchParams.get("bookingId");

  // -----------------------------
  // Fetch history (COMPLETED only)
  // -----------------------------
  useEffect(() => {
    let alive = true;

    async function fetchHistory() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/v2/bookings/my", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "โหลดข้อมูลไม่สำเร็จ");

        const rows = (data.bookings ?? []) as MyBookingDto[];

        const completed = rows.filter(
          (b) => b.status === "COMPLETED"
        );

        if (!alive) return;
        setBookings(completed);

        // ✅ ถ้ามาจากลิงก์ ให้ expand อัตโนมัติ
        if (bookingIdFromQuery) {
          const id = Number(bookingIdFromQuery);
          if (Number.isFinite(id)) {
            setExpandedId(id);
          }
        }
      } catch (err) {
        console.error(err);
        if (!alive) return;
        setBookings([]);
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    fetchHistory();
    return () => {
      alive = false;
    };
  }, [bookingIdFromQuery]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      completed: bookings.length,
    };
  }, [bookings]);

  // -----------------------------
  // UI
  // -----------------------------
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="xl" label="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <History className="w-6 h-6 text-primary-600" />
          ประวัติการให้คำปรึกษา
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          รายการนัดหมายที่ให้คำปรึกษาเสร็จสิ้นแล้ว
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="ทั้งหมด" value={stats.total} color="text-gray-700" />
        <StatCard
          label="เสร็จสิ้น"
          value={stats.completed}
          color="text-emerald-600"
        />
      </div>

      {/* List */}
      <Card className="rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-primary-500" />
          รายการทั้งหมด ({bookings.length})
        </h2>

        {bookings.length > 0 ? (
          <div className="relative pl-6">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-gray-200" />

            <div className="space-y-4">
              {bookings.map((booking) => {
                const isExpanded = expandedId === booking.bookingId;

                return (
                  <div key={booking.bookingId} className="relative">
                    <div className="absolute -left-[2px] top-5 h-3 w-3 rounded-full bg-primary-500 ring-4 ring-white" />
                    <MyAppointmentCard
                      booking={booking}
                      isCompact
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedId(isExpanded ? null : booking.bookingId)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-xl bg-gray-50">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-semibold text-gray-700">
              ยังไม่มีประวัติการให้คำปรึกษา
            </p>
            <p className="text-sm text-gray-500 mt-1">
              เมื่อมีการให้คำปรึกษาเสร็จสิ้นจะแสดงที่นี่
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

// -----------------------------
// Sub components
// -----------------------------
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="rounded-xl p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}
