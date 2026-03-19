// src/app/(tenant)/(university)/head-consultant/bookings/page.tsx

"use client";

import { useMemo, useState } from "react";
import { ClipboardList, RotateCw } from "lucide-react";

import { FilterBar } from "@/components/filters/FilterBar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  ADMIN_BOOKINGS_FILTER_DEFS,
  type AdminBookingsFilters,
} from "@/features/head-consultant/filters/defs";

import type { BookingStatus } from "@/features/head-consultant/bookings/types";
import { BookingsDashboard } from "@/features/head-consultant/bookings/components/BookingsDashboard";

import { useBookingsQuery } from "@/features/head-consultant/bookings/hook/useBookingsQuery";
import { useAssigneesQuery } from "@/features/head-consultant/bookings/hook/useAssigneesQuery";
import { useProblemCategoriesQuery } from "@/features/head-consultant/bookings/hook/useProblemCategoriesQuery";
import { useBookingActions } from "@/features/head-consultant/bookings/hook/useBookingActions";

import { toYMD, fromYMD } from "@/lib/date";

export default function HeadConsultantBookingsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("PENDING_ASSIGNMENT");
  const [consultantId, setConsultantId] = useState<string>("");
  const [problemCategoryId, setProblemCategoryId] = useState<string>("");
  const [assignmentMethod, setAssignmentMethod] = useState<"ALL" | "MANUAL" | "AUTO">("ALL");
  const [search, setSearch] = useState("");

  const { rows, isLoading, error, refresh } = useBookingsQuery({
    date: selectedDate,
    status: statusFilter,
    consultantId: consultantId || undefined,
    problemCategoryId: problemCategoryId || undefined,
    assignmentMethod: assignmentMethod,
  });

  const { assignees, isLoading: isLoadingAssignees } = useAssigneesQuery(
    selectedDate ? toYMD(selectedDate) : undefined
  );
  const { categories } = useProblemCategoriesQuery();

  const { doAssign, doReschedule } = useBookingActions();

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((b) => {
      const user = String((b as any).userName ?? "").toLowerCase();
      const problem = String((b as any).problemType ?? "").toLowerCase();
      const detail = String((b as any).problemDescription ?? "").toLowerCase();
      return user.includes(q) || problem.includes(q) || detail.includes(q);
    });
  }, [rows, search]);

  const filterValue: AdminBookingsFilters = useMemo(
    () => ({
      date: selectedDate ? toYMD(selectedDate) : "",
      status: statusFilter as any,
      search,
      consultantId,
      problemCategoryId,
      assignmentMethod
    }),
    [selectedDate, statusFilter, search, consultantId, problemCategoryId, assignmentMethod],
  );

  const dynamicDefs = useMemo(() => {
    return ADMIN_BOOKINGS_FILTER_DEFS.map((def) => {
      if (def.key === "status") {
        return {
          ...def,
          options: [
            { label: "รอมอบหมาย", value: "PENDING_ASSIGNMENT" }
          ]
        };
      }
      if (def.key === "consultantId") {
        return {
          ...def,
          options: [
            { label: "ทั้งหมด", value: "" },
            ...assignees.map((c) => ({ label: c.name, value: String(c.id) }))
          ]
        };
      }
      if (def.key === "problemCategoryId") {
        return {
          ...def,
          options: [
            { label: "ทั้งหมด", value: "" },
            ...categories.map((c) => ({ label: c.nameTh, value: String(c.id) }))
          ]
        };
      }
      return def;
    });
  }, [assignees, categories]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h5 className="text-2xl font-bold">จัดการคิวการให้คำปรึกษา</h5>
            <p className="text-sm text-gray-500">เลือกวันที่และตัวกรองเพื่อดูคิว</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={refresh}
          leftIcon={isLoading ? <Spinner /> : <RotateCw className="w-4 h-4" />}
        >
          รีเฟรช
        </Button>
      </div>

      <FilterBar
        defs={dynamicDefs}
        value={filterValue}
        dateKey="date"
        searchKey="search"
        searchPlaceholder="ค้นหาชื่อ / ประเภทเรื่อง / รายละเอียด..."
        onChange={(next) => {
          const nextDateStr = String((next as any).date ?? "").trim();
          if (nextDateStr) setSelectedDate(fromYMD(nextDateStr));
          else setSelectedDate(undefined);

          setStatusFilter(((next as any).status ?? "ALL") as any);
          setConsultantId(String((next as any).consultantId ?? ""));
          setProblemCategoryId(String((next as any).problemCategoryId ?? ""));
          setAssignmentMethod(((next as any).assignmentMethod ?? "ALL") as any);
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
        onAssign={async (bookingId, consultantId, borrowAssignmentId) => {
          const row = rows.find((r) => r.id === bookingId);
          if (!row) throw new Error("ไม่พบ booking ในรายการ");

          await doAssign({
            universityId: row.universityId,
            bookingId,
            consultantId,
            borrowAssignmentId,
          });
        }}
        onReschedule={async (bookingId, isoDateTime) => {
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
