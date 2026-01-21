'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MyBooking, BookingStatus } from '@/features/booking/types';

interface UseMyAppointmentsReturn {
  bookings: MyBooking[];
  activeBooking: MyBooking | null;
  pastBookings: MyBooking[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasActiveBooking: boolean;
}

export function useMyAppointments(): UseMyAppointmentsReturn {
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v2/bookings/my', {
        method: 'GET',
        credentials: 'include', // ✅ ส่ง cookie auth_token ชัวร์
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        // server อาจตอบ HTML ตอน 500
      }

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }

      setBookings((data?.bookings || []) as MyBooking[]);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err?.message || 'ไม่สามารถโหลดข้อมูลการจองได้');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const activeBooking =
    bookings.find((b) =>
      (['PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS'] as BookingStatus[]).includes(b.status)
    ) || null;

  const pastBookings = bookings.filter((b) =>
    (['COMPLETED', 'CANCELLED'] as BookingStatus[]).includes(b.status)
  );

  return {
    bookings,
    activeBooking,
    pastBookings,
    isLoading,
    error,
    refetch: fetchBookings,
    hasActiveBooking: !!activeBooking,
  };
}
