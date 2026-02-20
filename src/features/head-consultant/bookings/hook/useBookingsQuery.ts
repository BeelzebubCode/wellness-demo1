// src/features/head-consultant/bookings/hook/useBookingsQuery.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toYMD } from "@/lib/date";
import type { AdminBookingRow, AdminBookingStatusFilter } from "../types";
import { fetchAdminBookings } from "../api/bookings";

export function useBookingsQuery(input: {
  date?: Date;
  status: AdminBookingStatusFilter;
  consultantId?: string;
  problemCategoryId?: string;
  assignmentMethod?: "ALL" | "MANUAL" | "AUTO";
}) {
  const { date, status, consultantId, problemCategoryId, assignmentMethod = "ALL" } = input;

  const [rows, setRows] = useState<AdminBookingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDateStr = useMemo(() => (date ? toYMD(date) : ""), [date]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminBookings(selectedDateStr, status, consultantId, problemCategoryId, assignmentMethod);
      setRows(data);
    } catch (e: any) {
      setRows([]);
      setError(e?.message ?? "โหลดคิวไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDateStr, status, consultantId, problemCategoryId, assignmentMethod]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, isLoading, error, refresh, selectedDateStr };
}
