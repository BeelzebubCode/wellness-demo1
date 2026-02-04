// src/features/counseling-admin/bookings/components/BookingsDashboard.tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { DatePickerInput } from "@/components/filters/inputs/DatePickerInput";
import type { AdminBookingRow, AssigneeOption, BookingStatus } from "../types";
import { BookingsListCard } from "./BookingsListCard";
import { AssignBookingModal } from "./modals/AssignBookingModal";
import { ProblemDetailsModal } from "./modals/ProblemDetailsModal";
import { RescheduleBookingModal } from "./modals/RescheduleBookingModal";

import { toYMD, fromYMD } from "@/lib/date"; // ✅ ใช้ helper ที่คุณมีแล้ว

type StatusTab = { value: BookingStatus | "ALL"; label: string };

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_ASSIGNMENT: "รอมอบหมาย",
  ASSIGNED: "มอบหมายแล้ว",
  IN_PROGRESS: "กำลังให้คำปรึกษา",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

export function BookingsDashboard({
  selectedDate,
  onChangeDate,

  statusFilter,
  setStatusFilter,

  rows,
  isLoading,
  error,

  assignees,
  isLoadingAssignees,

  onRefresh,
  onAssign,
  onReschedule,
}: {
  selectedDate: Date;
  onChangeDate: (d: Date) => void;

  statusFilter: BookingStatus | "ALL";
  setStatusFilter: (s: BookingStatus | "ALL") => void;

  rows: AdminBookingRow[];
  isLoading: boolean;
  error: string | null;

  assignees: AssigneeOption[];
  isLoadingAssignees: boolean;

  onRefresh: () => void;
  onAssign: (bookingId: number, consultantId: number) => Promise<void>;
  onReschedule: (bookingId: number, isoDateTime: string) => Promise<void>;
}) {
  const [activeRow, setActiveRow] = useState<AdminBookingRow | null>(null);

  const [openDetails, setOpenDetails] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openReschedule, setOpenReschedule] = useState(false);

  const [isSavingAssign, setIsSavingAssign] = useState(false);
  const [isSavingReschedule, setIsSavingReschedule] = useState(false);

  const statusTabs = useMemo<StatusTab[]>(
    () => [
      { value: "ALL", label: "ทั้งหมด" },
      { value: "PENDING_ASSIGNMENT", label: STATUS_LABEL.PENDING_ASSIGNMENT },
      { value: "ASSIGNED", label: STATUS_LABEL.ASSIGNED },
      { value: "IN_PROGRESS", label: STATUS_LABEL.IN_PROGRESS },
      { value: "COMPLETED", label: STATUS_LABEL.COMPLETED },
      { value: "CANCELLED", label: STATUS_LABEL.CANCELLED },
    ],
    [],
  );

  // ✅ DatePickerInput ของคุณใช้ string (YYYY-MM-DD)
  const selectedYMD = useMemo(() => toYMD(selectedDate), [selectedDate]);

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <DatePickerInput
            value={selectedYMD}
            onChange={(ymd) => {
              // DatePickerInput อาจส่ง undefined ได้ (ถ้าผู้ใช้ลบค่า)
              if (!ymd) return;
              onChangeDate(fromYMD(ymd));
            }}
          />

          <div className="flex flex-wrap gap-2">
            {statusTabs.map((t) => (
              <Button
                key={t.value}
                size="sm"
                // ✅ Button ของคุณไม่มี "default" -> ใช้ primary/outline
                variant={statusFilter === t.value ? "primary" : "outline"}
                onClick={() => setStatusFilter(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          // ✅ Spinner จะถูกแสดงเป็น leftIcon ได้เหมือนเดิม
          leftIcon={isLoading ? <Spinner /> : undefined}
        >
          รีเฟรช
        </Button>
      </div>

      {/* body */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Spinner /> กำลังโหลดคิว...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-500">
          ไม่มีรายการในวันนี้
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <BookingsListCard
              key={String(r.id)}
              row={r}
              onClickDetails={() => {
                setActiveRow(r);
                setOpenDetails(true);
              }}
              onClickAssign={() => {
                setActiveRow(r);
                setOpenAssign(true);
              }}
              onClickReschedule={() => {
                setActiveRow(r);
                setOpenReschedule(true);
              }}
            />
          ))}
        </div>
      )}

      {/* modals */}
      <ProblemDetailsModal
        open={openDetails}
        onOpenChange={(v) => {
          setOpenDetails(v);
          if (!v) setActiveRow(null);
        }}
        booking={activeRow}
      />

      <AssignBookingModal
        open={openAssign}
        onOpenChange={(v) => {
          setOpenAssign(v);
          if (!v) setActiveRow(null);
        }}
        booking={activeRow}
        assignees={assignees}
        isLoadingAssignees={isLoadingAssignees}
        isSaving={isSavingAssign}
        onConfirmAssign={async (bookingId, consultantId) => {
          setIsSavingAssign(true);
          try {
            await onAssign(bookingId, consultantId);
            onRefresh();
          } finally {
            setIsSavingAssign(false);
          }
        }}
      />

      <RescheduleBookingModal
        open={openReschedule}
        onOpenChange={(v) => {
          setOpenReschedule(v);
          if (!v) setActiveRow(null);
        }}
        booking={activeRow}
        isSaving={isSavingReschedule}
        onConfirmReschedule={async (bookingId, isoDateTime) => {
          setIsSavingReschedule(true);
          try {
            await onReschedule(bookingId, isoDateTime);
            onRefresh();
          } finally {
            setIsSavingReschedule(false);
          }
        }}
      />
    </div>
  );
}
