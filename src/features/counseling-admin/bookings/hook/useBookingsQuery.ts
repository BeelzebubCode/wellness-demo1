// src/features/counseling-admin/bookings/hook/useBookingsQuery.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toYMD } from "@/lib/date";
import type { AdminBookingRow, AdminBookingStatusFilter } from "../types";
import { fetchAdminBookings } from "../api/bookings";

export function useBookingsQuery(input: {
  date: Date;
  status: AdminBookingStatusFilter;
}) {
  const { date, status } = input;

  const [rows, setRows] = useState<AdminBookingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDateStr = useMemo(() => toYMD(date), [date]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminBookings(selectedDateStr, status);
      setRows(data);
    } catch (e: any) {
      setRows([]);
      setError(e?.message ?? "โหลดคิวไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDateStr, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, isLoading, error, refresh, selectedDateStr };
}
