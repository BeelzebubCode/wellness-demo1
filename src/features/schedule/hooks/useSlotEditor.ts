// src/features/schedule/hooks/useSlotEditor.ts
'use client';

import { useState, useCallback } from 'react';
import { scheduleApi } from '../api';
import type { TimeSlot, CreateSlotDTO, AutoGenerateSlotDTO } from '../types';

export function useSlotEditor() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSlot = useCallback(async (data: CreateSlotDTO): Promise<TimeSlot | null> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await scheduleApi.createSlot(data);
      if (response.success && response.slot) {
        return response.slot;
      }
      setError(response.error || 'ไม่สามารถสร้าง slot ได้');
      return null;
    } catch (err) {
      console.error('Error creating slot:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const autoGenerate = useCallback(async (data: AutoGenerateSlotDTO): Promise<TimeSlot[] | null> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await scheduleApi.autoGenerateSlots(data);
      if (response.success && response.slots) {
        return response.slots;
      }
      setError(response.error || 'ไม่สามารถสร้าง slots ได้');
      return null;
    } catch (err) {
      console.error('Error auto-generating slots:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteSlots = useCallback(async (date: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await scheduleApi.deleteSlots(date);
      if (response.success) {
        return true;
      }
      setError(response.error || 'ไม่สามารถลบ slots ได้');
      return false;
    } catch (err) {
      console.error('Error deleting slots:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      return false;
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
    clearError: () => setError(null),
  };
}

export default useSlotEditor;