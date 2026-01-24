// src/features/schedule/hooks/useSlotEditor.ts
"use client";

import { useCallback, useState } from "react";
import { scheduleApi, type SlotsResponse } from "../api";
import type { AutoGenerateSlotDTO, CreateSlotDTO, UpdateSlotDTO } from "../types";

export function useSlotEditor() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSlot = useCallback(async (data: CreateSlotDTO): Promise<SlotsResponse> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await scheduleApi.createSlot(data);
      if (!res.success) setError(res.error ?? "ไม่สามารถสร้าง slot ได้");
      return res;
    } catch (e) {
      console.error("createSlot error:", e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      return { success: false, slots: [], error: "network" };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const autoGenerate = useCallback(async (data: AutoGenerateSlotDTO): Promise<SlotsResponse> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await scheduleApi.autoGenerateSlots(data);
      if (!res.success) setError(res.error ?? "ไม่สามารถสร้าง slots ได้");
      return res;
    } catch (e) {
      console.error("autoGenerate error:", e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      return { success: false, slots: [], error: "network" };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteSlots = useCallback(async (date: string): Promise<SlotsResponse> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await scheduleApi.deleteSlots(date);
      if (!res.success) setError(res.error ?? "ไม่สามารถลบ slots ได้");
      return res;
    } catch (e) {
      console.error("deleteSlots error:", e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      return { success: false, slots: [], error: "network" };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateSlot = useCallback(async (slotId: number, updates: UpdateSlotDTO) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await scheduleApi.updateSlot(slotId, updates);
      if (!res.success) setError(res.error ?? "อัปเดตไม่สำเร็จ");
      return res;
    } catch (e) {
      console.error("updateSlot error:", e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      return { success: false, error: "network" as const };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteSlot = useCallback(async (slotId: number) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await scheduleApi.deleteSlot(slotId);
      if (!res.success) setError(res.error ?? "ลบไม่สำเร็จ");
      return res;
    } catch (e) {
      console.error("deleteSlot error:", e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      return { success: false, error: "network" as const };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    error,
    createSlot,
    autoGenerate,
    deleteSlots,
    updateSlot,
    deleteSlot,
    clearError: () => setError(null),
  };
}

export default useSlotEditor;
