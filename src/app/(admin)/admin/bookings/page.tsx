// ==========================================
// 📌 Admin Page: Bookings Management
// path: /admin/bookings
// ==========================================

"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui";
import type { Booking } from "@/types";
import { toISODateString } from "@/lib/date";
import { CalendarDays, RefreshCw, ClipboardList } from "lucide-react";

// ✅ ใช้ปฏิทินเดียวกับหน้า /admin/schedule
import { ScheduleCalendar } from "@/components/admin/schedule";

// ✅ ใช้ของใหม่ (แยก components)
import {
  BookingsListCard,
  ProblemDetailsModal,
  RescheduleBookingModal,
  AssignBookingModal,
  type ReschedulePayload,
  type AssignPayload,
  type AssigneeOption,
} from "@/components/admin/bookings";

export default function AdminBookingsPage() {
  // --- state หลัก ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(
    null
  );
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null);
  const [problemTarget, setProblemTarget] = useState<Booking | null>(null);

  // วันที่รูปแบบ ISO ใช้เรียก API
  const selectedDateStr = useMemo(
    () => toISODateString(selectedDate),
    [selectedDate]
  );

  // วันที่แบบไทยไว้โชว์ใน UI
  const selectedDateLabel = useMemo(
    () =>
      selectedDate.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [selectedDate]
  );

  // ✅ ดึงรายการผู้ให้คำปรึกษาจริง
  const fetchAssignees = async () => {
    try {
      const res = await fetch("/api/v1/consultants");
      if (!res.ok) throw new Error("Failed to fetch consultants");
      const data = await res.json();

      // รองรับหลายรูปแบบ response (กันพัง)
      const rows = (data.consultants ?? data.data ?? data.items ?? []) as any[];

      const mapped: AssigneeOption[] = rows
        .map((c) => {
          // พยายามอ่าน id/name แบบยืดหยุ่น
          const id =
            c.id ??
            c.consultantId ??
            c.consultant_id ??
            c.consultant?.id ??
            c.consultant?.consultant_id;

          const name =
            c.name ??
            c.fullName ??
            c.displayName ??
            c.profileName ??
            c.consultant_name ??
            (c.profile
              ? `${c.profile.consultant_first_name ?? ""} ${
                  c.profile.consultant_last_name ?? ""
                }`.trim()
              : null);

          if (!id || !name) return null;
          return { id, name };
        })
        .filter(Boolean) as AssigneeOption[];

      setAssignees(mapped);
    } catch (err) {
      console.error(err);
      setAssignees([]); // ไม่ให้หน้าแตก
    }
  };

  const fetchBookings = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoading(true);

    try {
      const res = await fetch(`/api/v1/bookings?date=${selectedDateStr}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // โหลดข้อมูลเมื่อเปลี่ยนวัน
  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateStr]);

  // โหลด assignees ครั้งแรก
  useEffect(() => {
    fetchAssignees();
  }, []);

  const handleReschedule = async (payload: ReschedulePayload) => {
    if (!rescheduleTarget) return;

    try {
      setIsRefreshing(true);
      await fetch(`/api/admin/bookings/${rescheduleTarget.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setRescheduleTarget(null);
      await fetchBookings({ silent: true });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAssign = async (payload: AssignPayload) => {
    if (!assignTarget) return;

    try {
      setIsRefreshing(true);
      await fetch(`/api/admin/bookings/${assignTarget.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setAssignTarget(null);
      await fetchBookings({ silent: true });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-sm">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h5 className="text-2xl font-bold text-gray-900 leading-tight">
            จัดการคิวการให้คำปรึกษา
          </h5>
          <p className="text-sm text-gray-500 mt-1">
            เลือกวันที่จากปฏิทินเพื่อดูคิวทั้งหมดในวันนั้น และทำการเลื่อนนัด /
            แจกงาน
          </p>
        </div>
      </div>

      {/* ================= Top: Calendar + Info Bar ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar */}
        <div className="lg:col-span-4 xl:col-span-3">
          <ScheduleCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onMonthChange={setCurrentMonth}
          />
        </div>

        {/* Selected Date + Actions */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-primary-600" />
                </div>
                <div className="leading-tight">
                  <div className="text-xs text-gray-500">วันที่เลือก</div>
                  <div className="font-extrabold text-gray-900">
                    {selectedDateLabel}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsRefreshing(true);
                  fetchBookings({ silent: true });
                }}
                disabled={isRefreshing}
                className="h-10 rounded-xl flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                รีเฟรชรายการ
              </Button>
            </div>

            {/* Optional helper text */}
            <div className="mt-3 text-xs text-gray-500">
              เคล็ดลับ: เลือกวันจากปฏิทิน แล้วเลื่อนลงเพื่อจัดการคิว
              (เลื่อนเวลา/แจกงาน)
            </div>
          </div>
        </div>
      </div>

      {/* ================= Bottom: Booking List Full Width ================= */}
      <div className="space-y-3">
        <BookingsListCard
          isLoading={isLoading}
          bookings={bookings}
          onOpenProblem={(b) => setProblemTarget(b)}
          onOpenReschedule={(b) => setRescheduleTarget(b)}
          onOpenAssign={(b) => setAssignTarget(b)}
        />
      </div>

      {/* ✅ Modals */}
      <RescheduleBookingModal
        booking={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onConfirm={handleReschedule}
      />

      <AssignBookingModal
        booking={assignTarget}
        assignees={assignees}
        onClose={() => setAssignTarget(null)}
        onConfirm={handleAssign}
      />

      <ProblemDetailsModal
        booking={problemTarget}
        onClose={() => setProblemTarget(null)}
      />
    </div>
  );
}
