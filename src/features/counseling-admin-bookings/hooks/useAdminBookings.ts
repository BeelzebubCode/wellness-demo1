// /home/beelzebub/Web-Application/wellness-v3/src/features/counseling-admin-bookings/hooks/useAdminBookings.ts

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminBookingRow } from "../type";
import { fetchAdminBookingsV2, type AdminBookingStatusFilter } from "../api";
import { toISODateString } from "@/lib/date";

export function useAdminBookings(selectedDate: Date) {
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ ตัวกรองสถานะ (หน้า UI จะ set ค่าให้)
  const [statusFilter, setStatusFilter] =
    useState<AdminBookingStatusFilter>("ALL");

  const selectedDateStr = useMemo(
    () => toISODateString(selectedDate),
    [selectedDate],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await fetchAdminBookingsV2(selectedDateStr, statusFilter);
      setBookings(rows);
    } catch (e: any) {
      setError(e?.message ?? "โหลดคิวไม่สำเร็จ");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDateStr, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    bookings,
    isLoading,
    error,
    refresh,
    selectedDateStr,

    // ✅ export ให้หน้าเอาไปทำปุ่ม/แท็บกรอง
    statusFilter,
    setStatusFilter,
  };
}
