// src/app/(admin)/admin/schedule/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { toISODateString } from "@/lib/date";

import { ScheduleCalendar, SlotEditor } from "@/components/admin/schedule";
import ScheduleAssignModal from "@/components/admin/schedule/ScheduleAssignModal";
import ScheduleRescheduleModal from "@/components/admin/schedule/ScheduleRescheduleModal";

import type { Booking } from "@/types"; // bookings ยังใช้ของเดิมได้
import type { TimeSlot } from "@/features/schedule/types";

import { scheduleApi } from "@/features/schedule/api";
import { useSlotEditor } from "@/features/schedule/hooks/useSlotEditor";

type DayStatus = "OPEN" | "CLOSED";

export default function AdminSchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dayStatus, setDayStatus] = useState<DayStatus | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isSubmitting, updateSlot, deleteSlot, deleteSlots, createSlot } =
    useSlotEditor();

  // Modal Control
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null);

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(
    null
  );

  const dateStr = useMemo(() => toISODateString(selectedDate), [selectedDate]);

  const fetchDailyData = async (dateISO: string) => {
    setIsLoading(true);
    try {
      // ✅ slots จาก feature api
      const slotsRes = await scheduleApi.getSlots(dateISO, true);
      if (slotsRes.success) {
        setSlots(slotsRes.slots ?? []);
        setDayStatus(slotsRes.dayStatus ?? null);
      } else {
        setSlots([]);
        setDayStatus(null);
        console.error("getSlots error:", slotsRes.error);
      }

      // ✅ bookings ยังยิง endpoint เดิมของคุณ (ถ้า route นี้มีจริง)
      const bookingsRes = await fetch(`/api/v1/bookings?date=${dateISO}`, {
        cache: "no-store",
      });
      const bookingsJson = await bookingsRes.json();

      const activeBookings = (bookingsJson.bookings || []).filter(
        (b: Booking) => b.status !== "CANCELLED"
      );
      setBookings(activeBookings);
    } catch (err) {
      console.error("fetchDailyData error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDailyData(dateStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  // แจกงานให้ผู้ให้คำปรึกษา
  const handleAssignClick = (bookingId: string) => {
    const b = bookings.find((x) => String(x.id) === String(bookingId)) ?? null;
    setAssignBooking(b);
    setAssignModalOpen(true);
  };

  // เลื่อนนัด
  const handleRescheduleClick = (booking: Booking) => {
    setRescheduleBooking(booking);
    setRescheduleModalOpen(true);
  };

  const handleSuccess = () => {
    void fetchDailyData(dateStr);
  };

  // Toggle เปิด/ปิด "ทั้งวัน"
  const handleToggleDayStatus = async () => {
    setIsToggling(true);
    try {
      const nextStatus: DayStatus = dayStatus === "CLOSED" ? "OPEN" : "CLOSED";

      const res = await fetch("/api/admin/day-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, status: nextStatus }),
      });

      if (!res.ok) throw new Error("Failed to toggle day status");
      setDayStatus(nextStatus);
    } catch (error) {
      console.error("Error toggling day status:", error);
    } finally {
      setIsToggling(false);
    }
  };

  // =========================
  // Slot handlers (ใช้ feature)
  // =========================

  const handleDeleteAllSlots = async () => {
    if (!confirm("ต้องการลบช่วงเวลาทั้งวันนี้ใช่หรือไม่?")) return;
    setIsDeleting(true);
    try {
      await deleteSlots(dateStr);
      await fetchDailyData(dateStr);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddSlot = async () => {
    // TODO: ตอนหลังเปลี่ยนเป็นเปิด SlotFormModal
    await createSlot({
      date: dateStr,
      startTime: "09:00",
      endTime: "10:00",
      maxCapacity: 1,
    });
    await fetchDailyData(dateStr);
  };

  const handleEditSlot = async (index: number) => {
    const slot = slots[index];
    if (!slot) return;

    const currentCap = slot.maxCapacity ?? 1;
    const input = window.prompt(
      "แก้ไขความจุ (จำนวนคนที่รับได้ในช่วงนี้):",
      String(currentCap)
    );
    if (!input) return;

    const newCap = Number(input);
    if (Number.isNaN(newCap) || newCap <= 0) {
      alert("กรุณากรอกตัวเลขมากกว่า 0");
      return;
    }

    await updateSlot(slot.id, { capacity: newCap });
    await fetchDailyData(dateStr);
  };

  const handleDeleteSlot = async (index: number) => {
    const slot = slots[index];
    if (!slot) return;
    if (!confirm("ต้องการลบช่วงเวลานี้ใช่หรือไม่?")) return;

    await deleteSlot(slot.id);
    await fetchDailyData(dateStr);
  };

  const handleToggleSlotAvailability = async (index: number, next: boolean) => {
    const slot = slots[index];
    if (!slot) return;

    // ✅ backend แปลง isAvailable -> status (AVAILABLE/LOCKED) ใน [id]/route.ts ของคุณ
    await updateSlot(slot.id, { isAvailable: next });
    await fetchDailyData(dateStr);
  };

  const uiDayStatus =
    dayStatus == null
      ? null
      : {
          isClosed: dayStatus === "CLOSED",
        };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0 leading-tight">
            จัดการตารางคิว
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            ดูรายการจอง มอบหมายงาน และปรับเปลี่ยนตารางเวลา
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4">
          <ScheduleCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onMonthChange={setCurrentMonth}
          />
        </div>

        <div className="lg:col-span-9">
          <SlotEditor
            selectedDate={selectedDate}
            slots={slots as any} // ถ้า components ยังอิง @/types เดิมอยู่ เดี๋ยวข้อ 2 แก้ให้เนียน
            bookings={bookings}
            dayStatus={uiDayStatus}
            isLoading={isLoading || isSubmitting}
            isToggling={isToggling}
            isDeleting={isDeleting}
            onToggleDayStatus={handleToggleDayStatus}
            onDeleteAllSlots={handleDeleteAllSlots}
            onAddSlot={handleAddSlot}
            onEditSlot={handleEditSlot}
            onDeleteSlot={handleDeleteSlot}
            onAssignBooking={handleAssignClick}
            onRescheduleBooking={handleRescheduleClick}
            onToggleSlotAvailability={handleToggleSlotAvailability}
          />
        </div>
      </div>

      <ScheduleAssignModal
        isOpen={assignModalOpen}
        booking={assignBooking}
        onClose={() => {
          setAssignModalOpen(false);
          setAssignBooking(null);
        }}
        onSuccess={handleSuccess}
      />

      <ScheduleRescheduleModal
        isOpen={rescheduleModalOpen}
        booking={rescheduleBooking}
        onClose={() => setRescheduleModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
