// ==========================================
// 📌 Admin Page: Bookings Management
// path: /admin/bookings
// ==========================================

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui";
import type { Booking } from "@/types";
import { toISODateString } from "@/lib/date";

// ✅ calendar ตัวเดิม
import { ScheduleCalendar } from "@/components/admin/schedule";

// ✅ booking components
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
  /* ------------------------------------------------------------------
   * STATE
   * ------------------------------------------------------------------ */
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null);
  const [problemTarget, setProblemTarget] = useState<Booking | null>(null);

  // 🔥 คุมการเปิด / ปิดปฏิทิน
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const calendarRef = useRef<HTMLDivElement | null>(null);
  const calendarBtnRef = useRef<HTMLButtonElement | null>(null);

  /* ------------------------------------------------------------------
   * DATE FORMAT
   * ------------------------------------------------------------------ */
  const selectedDateStr = useMemo(
    () => toISODateString(selectedDate),
    [selectedDate]
  );

  const selectedDateLabel = useMemo(
    () =>
      selectedDate.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [selectedDate]
  );

  /* ------------------------------------------------------------------
   * FETCH
   * ------------------------------------------------------------------ */
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/bookings?date=${selectedDateStr}`);
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignees = async () => {
    try {
      const res = await fetch("/api/v1/consultants");
      const data = await res.json();

      const mapped: AssigneeOption[] = (data.consultants ?? [])
        .map((c: any) =>
          typeof c.id === "number" && c.name
            ? { id: c.id, name: c.name }
            : null
        )
        .filter(Boolean);

      setAssignees(mapped);
    } catch {
      setAssignees([]);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateStr]);

  useEffect(() => {
    fetchAssignees();
  }, []);

  /* ------------------------------------------------------------------
   * CLICK OUTSIDE → CLOSE CALENDAR
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!isCalendarOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        calendarRef.current?.contains(target) ||
        calendarBtnRef.current?.contains(target)
      ) {
        return; // ✅ คลิกภายใน ไม่ปิด
      }

      setIsCalendarOpen(false); // ✅ คลิกนอก ปิด
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCalendarOpen]);

  /* ------------------------------------------------------------------
   * ACTION HANDLERS
   * ------------------------------------------------------------------ */
  const handleReschedule = async (payload: ReschedulePayload) => {
    if (!rescheduleTarget) return;

    await fetch(`/api/admin/bookings/${rescheduleTarget.id}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setRescheduleTarget(null);
    fetchBookings();
  };

  const handleAssign = async (payload: AssignPayload) => {
    if (!assignTarget) return;

    await fetch(`/api/v2/bookings/${assignTarget.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    setAssignTarget(null);
    fetchBookings();
  };

  /* ------------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------------ */
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      {/* ================= Header ================= */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <h5 className="text-2xl font-bold">จัดการคิวการให้คำปรึกษา</h5>
          <p className="text-sm text-gray-500">
            เลือกวันที่จากปฏิทินเพื่อดูคิวในวันนั้น
          </p>
        </div>
      </div>

      {/* ================= Date Bar ================= */}
      <div className="relative rounded-2xl border bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">วันที่เลือก</div>
            <div className="font-bold">{selectedDateLabel}</div>
          </div>
        </div>

        <Button
          ref={calendarBtnRef}
          variant="outline"
          className="rounded-xl gap-2"
          onClick={() => setIsCalendarOpen((v) => !v)}
        >
          <CalendarDays className="w-4 h-4" />
          ดูปฏิทิน
        </Button>

        {/* ================= Calendar Popover ================= */}
        {isCalendarOpen && (
          <div
            ref={calendarRef}
            className="absolute top-full right-0 mt-3 z-50
                       rounded-2xl border bg-white shadow-xl p-4 w-[360px]"
          >
            <ScheduleCalendar
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onMonthChange={setCurrentMonth}
              onDateSelect={(date) => {
                setSelectedDate(date); // ✅ เปลี่ยนวันอย่างเดียว
              }}
            />
          </div>
        )}
      </div>

      {/* ================= Booking List ================= */}
      <BookingsListCard
        isLoading={isLoading}
        bookings={bookings}
        onOpenProblem={setProblemTarget}
        onOpenReschedule={setRescheduleTarget}
        onOpenAssign={setAssignTarget}
      />

      {/* ================= Modals ================= */}
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
