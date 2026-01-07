'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Booking } from '@/features/booking/types';

interface UseMyAppointmentsReturn {
  bookings: Booking[];
  activeBooking: Booking | null;
  pastBookings: Booking[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasActiveBooking: boolean;
}

export function useMyAppointments(): UseMyAppointmentsReturn {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // ✅ API สำหรับ "ของฉัน" เท่านั้น
      const response = await fetch('/api/v1/bookings/my');

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('ไม่สามารถโหลดข้อมูลการจองได้');
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
      ['PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS'].includes(b.status)
    ) || null;

  const pastBookings = bookings.filter((b) =>
    ['COMPLETED', 'CANCELLED'].includes(b.status)
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
