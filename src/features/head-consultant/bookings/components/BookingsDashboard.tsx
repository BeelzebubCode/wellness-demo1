// src/features/head-consultant/bookings/components/BookingsDashboard.tsx
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
  selectedDate?: Date;
  onChangeDate: (d: Date) => void;

  statusFilter: BookingStatus | "ALL";
  setStatusFilter: (s: BookingStatus | "ALL") => void;

  rows: AdminBookingRow[];
  isLoading: boolean;
  error: string | null;

  assignees: AssigneeOption[];
  isLoadingAssignees: boolean;

  onRefresh: () => void;
  onAssign: (bookingId: number, consultantId: number, borrowAssignmentId?: number) => Promise<void>;
  onReschedule: (bookingId: number, isoDateTime: string) => Promise<void>;
}) {
  const [activeRow, setActiveRow] = useState<AdminBookingRow | null>(null);

  const [openDetails, setOpenDetails] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openReschedule, setOpenReschedule] = useState(false);

  const [isSavingAssign, setIsSavingAssign] = useState(false);
  const [isSavingReschedule, setIsSavingReschedule] = useState(false);

  return (
    <div className="space-y-4">
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
          {selectedDate ? "ไม่มีรายการในวันที่เลือก" : "ไม่มีรายการทั้งหมด"}
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
        onConfirmAssign={async (bookingId, consultantId, borrowAssignmentId) => {
          setIsSavingAssign(true);
          try {
            await onAssign(bookingId, consultantId, borrowAssignmentId);
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
