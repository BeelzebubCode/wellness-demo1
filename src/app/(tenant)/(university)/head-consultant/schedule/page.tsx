// src/app/(admin)/admin/schedule/page.tsx

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { CalendarDays } from "lucide-react";
import { toISODateString } from "@/lib/date";

import { ScheduleCalendar, SlotEditor } from "@/components/head-consultant/schedule";

import type { TimeSlot } from "@/features/schedule/types";
import { scheduleApi } from "@/features/schedule/api";
import { useSlotEditor } from "@/features/schedule/hooks/useSlotEditor";
import { useAssigneesQuery } from "@/features/head-consultant/bookings/hook/useAssigneesQuery";

export default function AdminSchedulePage() {
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Data state
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // Hooks
  const { isSubmitting, updateSlot, deleteSlot, deleteSlots, createSlot } =
    useSlotEditor();

  // Date string
  const dateStr = useMemo(() => toISODateString(selectedDate), [selectedDate]);

  // Consultant data for capacity limits
  const { assignees } = useAssigneesQuery(dateStr);
  const maxTotalCapacity = Math.max(1, assignees.length);

  // ===============================
  // Data Fetching
  // ===============================
  const fetchDailyData = useCallback(async (dateISO: string) => {
    setIsLoading(true);
    try {
      const res = await scheduleApi.getSlots(dateISO);
      if (res.success) {
        setSlots(res.slots ?? []);
      } else {
        setSlots([]);
        console.error("getSlots error:", res.error);
      }
    } catch (err) {
      console.error("fetchDailyData error:", err);
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data when date changes
  useEffect(() => {
    void fetchDailyData(dateStr);
  }, [dateStr, fetchDailyData]);

  // ===============================
  // Slot CRUD Handlers
  // ===============================
  const handleAddSlot = useCallback(
    async (data: {
      startTime: string;
      endTime: string;
      maxCapacity: number;
    }) => {
      const res = await createSlot({
        date: dateStr,
        startTime: data.startTime,
        endTime: data.endTime,
        maxCapacity: data.maxCapacity,
      });
      if (res.success) {
        await fetchDailyData(dateStr);
      }
    },
    [dateStr, createSlot, fetchDailyData]
  );

  const handleAddSlotsBatch = async (
    _payload: Array<{ startTime: string; endTime: string; maxCapacity: number }>
  ) => {
    // TODO: Implement batch endpoint in v2 if needed
    console.warn("Batch endpoint not implemented yet");
    // await fetch("/api/v2/master/time-slots/batch", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     date: toISODateString(selectedDate),
    //     slots: payload,
    //   }),
    // });
  };

  const handleEditSlot = useCallback(
    async (
      slotId: number,
      data: { startTime?: string; endTime?: string; capacity?: number; maxCapacity?: number }
    ) => {
      const capacityValue = data.capacity ?? data.maxCapacity;

      const res = await updateSlot(slotId, {
        capacity: capacityValue,
        startTime: data.startTime,
        endTime: data.endTime,
      });
      if (res.success) {
        await fetchDailyData(dateStr);
      }
    },
    [dateStr, updateSlot, fetchDailyData]
  );

  const handleDeleteSlot = useCallback(
    async (slotId: number) => {
      const res = await deleteSlot(slotId);
      if (res.success) {
        await fetchDailyData(dateStr);
      }
    },
    [dateStr, deleteSlot, fetchDailyData]
  );

  const handleDeleteAllSlots = useCallback(async () => {
    const res = await deleteSlots(dateStr);
    if (res.success) {
      await fetchDailyData(dateStr);
    }
  }, [dateStr, deleteSlots, fetchDailyData]);

  const handleToggleSlotAvailability = useCallback(
    async (slotId: number, isAvailable: boolean) => {
      const res = await updateSlot(slotId, { isAvailable });
      if (res.success) {
        await fetchDailyData(dateStr);
      }
    },
    [dateStr, updateSlot, fetchDailyData]
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow-sm ring-4 ring-primary-50">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h5 className="text-2xl font-bold tracking-tight text-gray-900">จัดการตารางคิว</h5>
          <p className="text-sm text-gray-500">จัดการช่วงเวลาและความจุของแต่ละวัน</p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-3">
          <ScheduleCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onMonthChange={setCurrentMonth}
          />
        </div>

        {/* Slot Editor */}
        <div className="lg:col-span-9">
          <SlotEditor
            selectedDate={selectedDate}
            slots={slots}
            isLoading={isLoading || isSubmitting}
            onAddSlot={handleAddSlot}
            onAddSlotsBatch={handleAddSlotsBatch}
            onEditSlot={handleEditSlot}
            onDeleteSlot={handleDeleteSlot}
            onDeleteAllSlots={handleDeleteAllSlots}
            onToggleSlotAvailability={handleToggleSlotAvailability}
            maxTotalCapacity={maxTotalCapacity}
          />
        </div>
      </div>
    </div>
  );
}
