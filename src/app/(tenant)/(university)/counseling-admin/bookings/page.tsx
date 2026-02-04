// src/app/(tenant)/(university)/counseling-admin/bookings/page.tsx

"use client";

import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import { FilterBar } from "@/components/filters/FilterBar";
import {
  ADMIN_BOOKINGS_FILTER_DEFS,
  type AdminBookingsFilters,
} from "@/features/counseling-admin/filters/defs";

import type { BookingStatus } from "@/features/counseling-admin/bookings/types";
import { BookingsDashboard } from "@/features/counseling-admin/bookings/components/BookingsDashboard";

import { useBookingsQuery } from "@/features/counseling-admin/bookings/hook/useBookingsQuery";
import { useAssigneesQuery } from "@/features/counseling-admin/bookings/hook/useAssigneesQuery";
import { useBookingActions } from "@/features/counseling-admin/bookings/hook/useBookingActions";

import { toYMD, fromYMD } from "@/lib/date";

export default function CounselingAdminBookingsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const { rows, isLoading, error, refresh } = useBookingsQuery({
    date: selectedDate,
    status: statusFilter,
  });

  // ✅ rename ให้ตรง prop ที่ต้องใช้
  const { assignees, isLoading: isLoadingAssignees } = useAssigneesQuery();

  // ✅ destructure ให้ตรงกับ hook
  const { doAssign, doReschedule } = useBookingActions();

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((b) => {
      const user = String((b as any).userName ?? "").toLowerCase();
      const line = String((b as any).lineUserId ?? "").toLowerCase();
      const problem = String((b as any).problemType ?? "").toLowerCase();
      const detail = String((b as any).problemDescription ?? "").toLowerCase();
      return user.includes(q) || line.includes(q) || problem.includes(q) || detail.includes(q);
    });
  }, [rows, search]);

  const filterValue: AdminBookingsFilters = useMemo(
    () => ({ date: toYMD(selectedDate), status: statusFilter as any, search }),
    [selectedDate, statusFilter, search],
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h5 className="text-2xl font-bold">จัดการคิวการให้คำปรึกษา</h5>
          <p className="text-sm text-gray-500">เลือกวันที่และตัวกรองเพื่อดูคิว</p>
        </div>
      </div>

      <FilterBar
        defs={ADMIN_BOOKINGS_FILTER_DEFS}
        value={filterValue}
        dateKey="date"
        searchKey="search"
        searchPlaceholder="ค้นหาชื่อ / LINE ID / ประเภทเรื่อง / รายละเอียด..."
        onChange={(next) => {
          const nextDateStr = String((next as any).date ?? "").trim();
          if (nextDateStr) setSelectedDate(fromYMD(nextDateStr));

          setStatusFilter(((next as any).status ?? "ALL") as any);
          setSearch(String((next as any).search ?? ""));
        }}
      />

      <BookingsDashboard
        selectedDate={selectedDate}
        onChangeDate={setSelectedDate}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        rows={filteredRows}
        isLoading={isLoading}
        error={error}
        assignees={assignees}
        isLoadingAssignees={isLoadingAssignees}
        onRefresh={refresh}
        onAssign={async (bookingId, consultantId) => {
          // ✅ เอา universityId จาก row (BookingCore มี universityId)
          const row = rows.find((r) => r.id === bookingId);
          if (!row) throw new Error("ไม่พบ booking ในรายการ");

          await doAssign({
            universityId: row.universityId,
            bookingId,
            consultantId,
          });
        }}
        onReschedule={async (bookingId, isoDateTime) => {
          // ⚠️ ตอนนี้ hook ต้องการ newTimeSlotId (number)
          // ถ้า isoDateTime เป็น id จริง ๆ ให้ parse ได้เลย
          const row = rows.find((r) => r.id === bookingId);
          if (!row) throw new Error("ไม่พบ booking ในรายการ");

          const newTimeSlotId = Number(isoDateTime);
          if (!Number.isFinite(newTimeSlotId)) {
            throw new Error("ค่าเวลาที่ส่งมาไม่ใช่ timeSlotId (ตัวเลข)");
          }

          await doReschedule({
            universityId: row.universityId,
            bookingId,
            newTimeSlotId,
          });
        }}
      />
    </div>
  );
}
