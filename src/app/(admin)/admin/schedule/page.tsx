"use client";

import { useState, useEffect } from "react";
import { toISODateString } from "@/lib/date";
import { CalendarDays } from "lucide-react";
import type { TimeSlot, Booking } from "@/types";

// Components
import { ScheduleCalendar, SlotEditor } from "@/components/admin/schedule";
import { AssignBookingModal, RescheduleBookingModal } from '@/components/admin/bookings'; 

type DayStatus = "OPEN" | "CLOSED";

interface SlotCreatePayload {
  startTime: string;
  endTime: string;
  capacity?: number;
}

interface SlotUpdatePayload {
  startTime?: string;
  endTime?: string;
  capacity?: number;
  isAvailable?: boolean; // ใช้สำหรับเปิด/ปิดเฉพาะช่วงเวลา
}

export default function AdminSchedulePage() {
  // State หลัก
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Data State
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dayStatus, setDayStatus] = useState<DayStatus | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isToggling, setIsToggling] = useState(false); // toggle ทั้งวัน
  const [isDeleting, setIsDeleting] = useState(false); // ลบทั้งวัน
  const [isMutatingSlot, setIsMutatingSlot] = useState(false); // add/edit/delete รายช่วง

  // Modal Control
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignBookingId, setAssignBookingId] = useState<string | null>(null);

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(
    null
  );

  // Fetch Data เมื่อเปลี่ยนวัน
  useEffect(() => {
    fetchDailyData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const fetchDailyData = async (date: Date) => {
    setIsLoading(true);
    try {
      const dateStr = toISODateString(date);

      // ดึงทั้ง Slots + สถานะวัน + Bookings พร้อมกัน
      const [slotsRes, bookingsRes] = await Promise.all([
        fetch(`/api/v1/slots?date=${dateStr}`),
        fetch(`/api/v1/bookings?date=${dateStr}`),
      ]);

      const slotsData = await slotsRes.json();
      setSlots(slotsData.slots || []);
      // ให้ backend ส่ง dayStatus มาด้วย เช่น 'OPEN' | 'CLOSED'
      setDayStatus(slotsData.dayStatus ?? null);

      const bookingsData = await bookingsRes.json();
      const activeBookings = (bookingsData.bookings || []).filter(
        (b: Booking) => b.status !== "CANCELLED"
      );
      setBookings(activeBookings);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // Handlers สำหรับปุ่มกด
  // =========================

  // แจกงานให้ผู้ให้คำปรึกษา
  const handleAssignClick = (bookingId: string) => {
    setAssignBookingId(bookingId);
    setAssignModalOpen(true);
  };

  // เลื่อนนัด
  const handleRescheduleClick = (booking: Booking) => {
    setRescheduleBooking(booking);
    setRescheduleModalOpen(true);
  };

  // reload หลังจาก action สำเร็จ (จาก modal อื่น)
  const handleSuccess = () => {
    fetchDailyData(selectedDate);
  };

  // Toggle เปิด/ปิด "ทั้งวัน"
  const handleToggleDayStatus = async () => {
    if (!selectedDate) return;
    setIsToggling(true);
    try {
      const dateStr = toISODateString(selectedDate);
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
  // Helpers สำหรับจัดการ slot จริง ๆ (API)
  // =========================

  const createSlot = async (payload: SlotCreatePayload) => {
    setIsMutatingSlot(true);
    try {
      const dateStr = toISODateString(selectedDate);
      const res = await fetch("/api/v1/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          ...payload,
        }),
      });
      if (!res.ok) throw new Error("Failed to add slot");

      await fetchDailyData(selectedDate);
    } catch (error) {
      console.error("Error adding slot:", error);
    } finally {
      setIsMutatingSlot(false);
    }
  };

  const updateSlot = async (slotId: string, updates: SlotUpdatePayload) => {
    setIsMutatingSlot(true);
    try {
      const res = await fetch(`/api/v1/slots/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update slot");

      await fetchDailyData(selectedDate);
    } catch (error) {
      console.error("Error updating slot:", error);
    } finally {
      setIsMutatingSlot(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    setIsMutatingSlot(true);
    try {
      const res = await fetch(`/api/v1/slots/${slotId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete slot");

      await fetchDailyData(selectedDate);
    } catch (error) {
      console.error("Error deleting slot:", error);
    } finally {
      setIsMutatingSlot(false);
    }
  };

  // =========================
  // Handlers ที่โยนให้ SlotEditor (ตาม props ของ SlotEditor)
  // =========================

  // ลบช่วงเวลาทั้งวัน
  const handleDeleteAllSlots = async () => {
    if (!selectedDate) return;
    if (!confirm("ต้องการลบช่วงเวลาทั้งวันนี้ใช่หรือไม่?")) return;

    setIsDeleting(true);
    try {
      const dateStr = toISODateString(selectedDate);
      const res = await fetch(`/api/v1/slots?date=${dateStr}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete all slots");

      await fetchDailyData(selectedDate);
    } catch (error) {
      console.error("Error deleting all slots:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 👉 อันนี้ต้องเป็น () => void ตามที่ SlotEditor ต้องการ
  const handleAddSlot = () => {
    // ตอนนี้ยังไม่มีฟอร์ม แถมค่า default ง่าย ๆ ให้ก่อน
    const payload: SlotCreatePayload = {
      startTime: "09:00",
      endTime: "10:00",
      capacity: 5,
    };
    void createSlot(payload);
  };

  // แก้ไขช่วงเวลา: ตอนนี้ทำแบบง่าย ๆ ให้แก้แค่ capacity ผ่าน prompt
  const handleEditSlot = (index: number) => {
    const slot = slots[index];
    if (!slot) return;

    const currentCap = (slot as any).capacity ?? 5;
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

    void updateSlot(slot.id, { capacity: newCap });
  };

  // ลบช่วงเวลาเดียว (รับ index ตามที่ SlotEditor ส่งมา)
  const handleDeleteSlot = (index: number) => {
    const slot = slots[index];
    if (!slot) return;
    if (!confirm("ต้องการลบช่วงเวลานี้ใช่หรือไม่?")) return;

    void deleteSlot(slot.id);
  };

  // เปิด / ปิดเฉพาะช่วงเวลา (ใช้ index + next ที่ SlotEditor ส่งมา)
  const handleToggleSlotAvailability = async (index: number, next: boolean) => {
    const slot = slots[index];
    if (!slot) return;

    try {
      await updateSlot(slot.id, { isAvailable: next });
    } catch (err) {
      console.error("toggle slot failed", err);
    }
  };

  const uiDayStatus =
    dayStatus == null
      ? null
      : {
          isClosed: dayStatus === "CLOSED",
        };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
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

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Calendar (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <ScheduleCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onMonthChange={setCurrentMonth}
          />
        </div>

        {/* Right: Booking List + Slot Editor (9 cols) */}
        <div className="lg:col-span-9">
          <SlotEditor
            selectedDate={selectedDate}
            slots={slots}
            bookings={bookings}
            dayStatus={uiDayStatus}
            isLoading={isLoading || isMutatingSlot}
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

      {/* Modals */}
      <AssignBookingModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        bookingId={assignBookingId}
        onSuccess={handleSuccess}
      />

      <RescheduleBookingModal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        booking={rescheduleBooking}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
