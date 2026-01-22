// src/features/booking/hooks/useBooking.ts
"use client";

import { useState, useCallback } from "react";
import type { CreateBookingDTO, Booking } from "@/features/booking/types";

interface UseBookingReturn {
  createBooking: (data: CreateBookingDTO) => Promise<Booking>;
  cancelBooking: (id: string | number, reason?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

type ApiErrorShape = { error?: string; message?: string };
type CreateBookingResponse =
  | { success: true; booking?: Booking; bookingId?: string | number }
  | ({ success?: false } & ApiErrorShape & Record<string, any>)
  | (ApiErrorShape & Record<string, any>);

// helper: parse JSON แบบปลอดภัย (เผื่อ response ว่าง/ไม่ใช่ JSON)
async function safeJson<T = any>(response: Response): Promise<T | null> {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function pickErrorMessage(res: Response, body: any) {
  return (
    body?.error || body?.message || `Request failed (status ${res.status})`
  );
}

export function useBooking(): UseBookingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = useCallback(
    async (data: CreateBookingDTO): Promise<Booking> => {
      setIsLoading(true);
      setError(null);

      try {
        // ✅ Guard ก่อนยิง API
        if (!data.studentCode)
          throw new Error("ไม่พบ studentCode (account_username)");
        if (!data.timeSlotId || Number(data.timeSlotId) <= 0)
          throw new Error("timeSlotId ไม่ถูกต้อง");
        if (!data.problemCategoryId || Number(data.problemCategoryId) <= 0)
          throw new Error("problemCategoryId ไม่ถูกต้อง");

        // ✅ v2 endpoint
        const response = await fetch("/api/v2/bookings", {
          method: "POST",
          credentials: "include", // ✅ สำคัญ: ส่ง auth_token + tenant_code
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await safeJson<CreateBookingResponse>(response);

        if (!response.ok) {
          const msg = pickErrorMessage(response, result);
          throw new Error(msg);
        }

        const booking = (result as any)?.booking as Booking | undefined;
        const bookingIdRaw = (result as any)?.bookingId as
          | string
          | number
          | undefined;

        if (booking) return booking;

        if (bookingIdRaw !== undefined && bookingIdRaw !== null) {
          const bookingId =
            typeof bookingIdRaw === "string"
              ? Number.parseInt(bookingIdRaw, 10)
              : bookingIdRaw;

          if (!Number.isFinite(bookingId)) {
            throw new Error("Invalid bookingId from server");
          }

          return {
            id: bookingId, // ✅ number
            studentId: 0,
            studentName: "",
            problemType: "",
            problemCategoryId: data.problemCategoryId,
            status: "PENDING_ASSIGNMENT",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        throw new Error("Invalid response from server");
      } catch (err: any) {
        const errorMessage = err?.message || "เกิดข้อผิดพลาดในการจอง";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const cancelBooking = useCallback(
    async (id: string | number, reason?: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!id) throw new Error("booking id ไม่ถูกต้อง");

        // ✅ v2 endpoint
        // ถ้า backend ของนายใช้ PUT ก็เปลี่ยน method เป็น "PUT" ได้ทันที
        const response = await fetch(`/api/v2/bookings/${id}`, {
          method: "PATCH",
          credentials: "include", // ✅ สำคัญ
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", cancelReason: reason }),
        });

        const result = await safeJson<any>(response);

        if (!response.ok) {
          const msg = pickErrorMessage(response, result);
          throw new Error(msg);
        }

        return;
      } catch (err: any) {
        const errorMessage = err?.message || "เกิดข้อผิดพลาดในการยกเลิก";
        console.error("[cancelBooking]", err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createBooking,
    cancelBooking,
    isLoading,
    error,
    clearError,
  };
}
