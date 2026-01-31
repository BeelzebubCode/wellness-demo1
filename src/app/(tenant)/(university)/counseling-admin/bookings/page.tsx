// src/app/admin/bookings/page.tsx
"use client";

import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import {
  BookingsListCard,
  ProblemDetailsModal,
  RescheduleBookingModal,
  AssignBookingModal,
  BookingsDashboard,
  type ReschedulePayload,
  type AssignPayload,
} from "@/components/counseling-admin/bookings";

import type { AdminBookingRow } from "@/features/counseling-admin-bookings/type";
import { useAdminBookings } from "@/features/counseling-admin-bookings/hooks/useAdminBookings";
import { useAssignees } from "@/features/counseling-admin-bookings/hooks/useAssignees";

import { FilterBar } from "@/components/filters/FilterBar";
import type { AdminBookingStatusFilter } from "@/features/counseling-admin-bookings/api";

import {
  ADMIN_BOOKINGS_FILTER_DEFS,
  type AdminBookingsFilters,
} from "@/features/counseling-admin-bookings/filters/defs";

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromYMD(s: string) {
  return new Date(`${s}T00:00:00`);
}

export default function AdminBookingsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [search, setSearch] = useState<string>(""); // ✅ เพิ่ม

  const { bookings, isLoading, refresh, statusFilter, setStatusFilter } =
    useAdminBookings(selectedDate);

  const { assignees } = useAssignees();

  // modals
  const [rescheduleTarget, setRescheduleTarget] =
    useState<AdminBookingRow | null>(null);
  const [assignTarget, setAssignTarget] = useState<AdminBookingRow | null>(
    null,
  );
  const [problemTarget, setProblemTarget] = useState<AdminBookingRow | null>(
    null,
  );

  // ✅ ส่งค่าให้ FilterBar (date + status + search)
  const filterValue: AdminBookingsFilters = useMemo(
    () => ({
      date: toYMD(selectedDate),
      status: statusFilter as any,
      search,
    }),
    [selectedDate, statusFilter, search],
  );

  // ✅ กรองใน client (ชื่อ / LINE ID / ประเภทปัญหา)
  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;

    return bookings.filter((b: any) => {
      const userName = String(b.userName ?? "").toLowerCase();
      const lineUserId = String(b.lineUserId ?? "").toLowerCase();
      const problemType = String(b.problemType ?? "").toLowerCase();
      const detail = String(
        b.problemDescription ?? b.detailText ?? "",
      ).toLowerCase();

      return (
        userName.includes(q) ||
        lineUserId.includes(q) ||
        problemType.includes(q) ||
        detail.includes(q)
      );
    });
  }, [bookings, search]);

  const handleReschedule = async (payload: ReschedulePayload) => {
    if (!rescheduleTarget) return;

    await fetch(`/api/admin/bookings/${rescheduleTarget.id}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    setRescheduleTarget(null);
    refresh();
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
    refresh();
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <h5 className="text-2xl font-bold">จัดการคิวการให้คำปรึกษา</h5>
          <p className="text-sm text-gray-500">
            เลือกวันที่และตัวกรองเพื่อดูคิว
          </p>
        </div>
      </div>

      {/* ✅ Filters + Search */}
      <FilterBar
        defs={ADMIN_BOOKINGS_FILTER_DEFS}
        value={filterValue}
        dateKey="date" // ✅ เพิ่มบรรทัดนี้ (ปัก date ไว้บนแถบหลัก)
        searchKey="search"
        searchPlaceholder="ค้นหาชื่อ / LINE ID / ประเภทเรื่อง / รายละเอียด..."
        onChange={(next) => {
          // date
          const nextDateStr = String((next as any).date ?? "").trim();
          if (nextDateStr) setSelectedDate(fromYMD(nextDateStr));

          // status
          setStatusFilter(
            ((next as any).status ?? "ALL") as AdminBookingStatusFilter,
          );

          // search
          setSearch(String((next as any).search ?? ""));
        }}
      />

      {/* Dashboard */}
      {!isLoading && <BookingsDashboard bookings={filteredBookings} />}

      {/* Booking List */}
      <BookingsListCard
        isLoading={isLoading}
        bookings={filteredBookings}
        onOpenProblem={setProblemTarget}
        onOpenReschedule={setRescheduleTarget}
        onOpenAssign={setAssignTarget}
      />

      {/* Modals */}
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
