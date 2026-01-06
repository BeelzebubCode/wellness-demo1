// src/features/booking/api.ts

import type { Booking, BookingDetail, CreateBookingDTO, TimeSlot, ProblemCategory, BookingStatus } from './types';

const API_BASE = '/api/v1';

export const bookingApi = {
  // ==================== BOOKINGS ====================
  
  // Get all bookings with filters
  async getBookings(params?: {
    status?: BookingStatus;
    consultantId?: number;
    studentId?: number;
    lineUserId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; bookings: Booking[] }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.consultantId) searchParams.set('consultantId', params.consultantId.toString());
    if (params?.studentId) searchParams.set('studentId', params.studentId.toString());
    if (params?.lineUserId) searchParams.set('lineUserId', params.lineUserId);
    if (params?.date) searchParams.set('date', params.date);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const res = await fetch(`${API_BASE}/bookings?${searchParams.toString()}`);
    return res.json();
  },

  // Get booking by ID
  async getBookingById(id: number): Promise<{ success: boolean; booking: BookingDetail }> {
    const res = await fetch(`${API_BASE}/bookings/${id}`);
    return res.json();
  },

  // Create new booking
  async createBooking(data: CreateBookingDTO): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Update booking (assign, start, complete, cancel)
  async updateBooking(
    id: number,
    action: 'assign' | 'start' | 'complete' | 'cancel',
    data?: Record<string, unknown>
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data }),
    });
    return res.json();
  },

  // ==================== TIME SLOTS ====================
  
  // Get time slots for a date
  async getTimeSlots(date: string, showAll = false): Promise<{ success: boolean; slots: TimeSlot[] }> {
    const params = new URLSearchParams({ date });
    if (showAll) params.set('all', 'true');
    
    const res = await fetch(`${API_BASE}/time-slots?${params.toString()}`);
    return res.json();
  },

  // Create time slots
  async createTimeSlots(data: {
    date: string;
    slots?: Array<{ startTime: string; endTime: string; maxCapacity?: number }>;
    autoGenerate?: boolean;
    startHour?: number;
    endHour?: number;
    slotDuration?: number;
  }): Promise<{ success: boolean; slots?: TimeSlot[]; error?: string }> {
    const res = await fetch(`${API_BASE}/time-slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Delete time slots
  async deleteTimeSlots(date: string): Promise<{ success: boolean; deleted?: number; error?: string }> {
    const res = await fetch(`${API_BASE}/time-slots?date=${date}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // ==================== PROBLEM CATEGORIES ====================
  
  // Get problem categories
  async getProblemCategories(): Promise<{ success: boolean; categories: ProblemCategory[] }> {
    const res = await fetch(`${API_BASE}/problem-categories`);
    return res.json();
  },
};

export default bookingApi;