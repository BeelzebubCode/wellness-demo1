// src/components/admin/schedule/SlotFormModal.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal, Button } from '@/components/ui';
import {
  Clock,
  Users,
  Save,
  Plus,
  AlertCircle,
  Loader2,
  Trash2,
  Power,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TimeSlot } from '@/features/schedule/types';

interface SlotFormData {
  startTime: string;
  endTime: string;
  maxCapacity: number;
}

interface SlotFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SlotFormData) => Promise<void>;
  onToggleAvailability?: (slotId: number, isAvailable: boolean) => Promise<void>;
  onDelete?: (slotId: number) => Promise<void>;
  editingSlot?: TimeSlot | null;
  existingSlots?: TimeSlot[];
  maxTotalCapacity?: number;
}

// Time presets
const TIME_PRESETS = [
  { label: '30 นาที', duration: 30 },
  { label: '45 นาที', duration: 45 },
  { label: '1 ชม.', duration: 60 },
  { label: '1.5 ชม.', duration: 90 },
];

// Generate time options
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let h = 7; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function SlotFormModal({
  isOpen,
  onClose,
  onSubmit,
  onToggleAvailability,
  onDelete,
  editingSlot,
  existingSlots = [],
  maxTotalCapacity = 99
}: SlotFormModalProps) {
  const isEditing = !!editingSlot;

  const [formData, setFormData] = useState<SlotFormData>({
    startTime: '09:00',
    endTime: '10:00',
    maxCapacity: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingSlot) {
        setFormData({
          startTime: editingSlot.startTime,
          endTime: editingSlot.endTime,
          maxCapacity: editingSlot.maxCapacity
        });
      } else {
        setFormData({
          startTime: '09:00',
          endTime: '10:00',
          maxCapacity: 1
        });
      }
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, editingSlot]);

  // Calculate duration
  const duration = useMemo(() => {
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  }, [formData.startTime, formData.endTime]);

  // Check for time conflicts
  const hasConflict = useMemo(() => {
    const [newStartH, newStartM] = formData.startTime.split(':').map(Number);
    const [newEndH, newEndM] = formData.endTime.split(':').map(Number);
    const newStart = newStartH * 60 + newStartM;
    const newEnd = newEndH * 60 + newEndM;

    return existingSlots.some(slot => {
      if (isEditing && slot.id === editingSlot?.id) return false;

      // If the slot is closed and has no bookings, treat it as overwriteable (no conflict)
      const isSlotClosed = slot.status === 'CLOSED' || !slot.isAvailable;
      const hasNoBookings = (slot.bookedCount ?? 0) === 0;
      if (isSlotClosed && hasNoBookings) return false;

      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      const start = startH * 60 + startM;
      const end = endH * 60 + endM;

      return (newStart < end && newEnd > start);
    });
  }, [formData.startTime, formData.endTime, existingSlots, isEditing, editingSlot]);

  const isValid = duration > 0 && formData.maxCapacity >= 1;

  // Slot status
  const isLocked = editingSlot?.status === 'CLOSED' || !editingSlot?.isAvailable;
  const hasBookings = (editingSlot?.bookedCount ?? 0) > 0;

  // Apply duration preset
  const applyPreset = (minutes: number) => {
    const [h, m] = formData.startTime.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const endMinutes = startMinutes + minutes;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;

    if (endH <= 20) {
      setFormData({
        ...formData,
        endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
      });
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle availability
  const handleToggleStatus = async () => {
    if (!editingSlot || !onToggleAvailability || hasBookings) return;

    setIsTogglingStatus(true);
    setError(null);

    try {
      await onToggleAvailability(editingSlot.id, !editingSlot.isAvailable);
      onClose();
    } catch (err: any) {
      setError(err.message || 'เปลี่ยนสถานะไม่สำเร็จ');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!editingSlot || !onDelete || hasBookings) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onDelete(editingSlot.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'ลบไม่สำเร็จ');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isLoading = isSubmitting || isTogglingStatus || isDeleting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'แก้ไขช่วงเวลา' : 'เพิ่มช่วงเวลาใหม่'}
      size="lg"
      className="p-6"
    >
      {/* Delete Confirmation */}
      {showDeleteConfirm ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600">
              ต้องการลบช่วงเวลา <span className="font-semibold">{editingSlot?.startTime} - {editingSlot?.endTime}</span> ใช่หรือไม่?
            </p>
            <p className="text-xs text-red-500 mt-1">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ยืนยันลบ'}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Status Badge (editing only) */}
          {isEditing && (
            <div className={cn(
              'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border',
              isLocked ? 'bg-slate-50 border-slate-200' : 'bg-primary-50 border-primary-100'
            )}>
              <div className="flex items-center gap-2.5">
                <div className={cn('p-1.5 rounded-md', isLocked ? 'bg-white' : 'bg-primary-100/50')}>
                  <Power className={cn('w-4 h-4', isLocked ? 'text-slate-500' : 'text-primary-600')} />
                </div>
                <span className={cn('text-sm font-bold', isLocked ? 'text-slate-600' : 'text-primary-700')}>
                  {isLocked ? 'ปิดให้จอง' : 'เปิดให้จอง'}
                </span>
              </div>
              {onToggleAvailability && (
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={isLoading || hasBookings}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    hasBookings
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : isLocked
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-slate-500 text-white hover:bg-slate-600'
                  )}
                >
                  {isTogglingStatus ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isLocked ? 'เปิด' : 'ปิด'}
                </button>
              )}
            </div>
          )}

          {/* Booking Warning */}
          {isEditing && hasBookings && (
            <div className="flex items-center gap-2 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-700 text-sm shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              มีการจอง {editingSlot?.bookedCount} รายการ ไม่สามารถปิดหรือลบได้
            </div>
          )}

          {/* Time Selection */}
          <div className="space-y-4 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-base font-bold text-slate-700">
              <div className="p-1.5 bg-white shadow-sm rounded-lg border border-slate-100">
                <Clock className="w-5 h-5 text-primary-500" />
              </div>
              เวลาที่ให้บริการ
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">เวลาเริ่มต้น</label>
                <select
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className={cn("w-full px-3 py-2.5 text-sm font-medium border rounded-xl outline-none shadow-sm transition-shadow",
                    (isEditing && hasBookings) || isLoading
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-white border-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 hover:border-slate-300"
                  )}
                  disabled={(isEditing && hasBookings) || isLoading}
                >
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">เวลาสิ้นสุด</label>
                <select
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2.5 text-sm font-medium border rounded-xl outline-none shadow-sm transition-shadow',
                    (isEditing && hasBookings) || isLoading
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : duration <= 0
                        ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-400'
                        : 'bg-white border-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 hover:border-slate-300'
                  )}
                  disabled={(isEditing && hasBookings) || isLoading}
                >
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {TIME_PRESETS.map(preset => (
                <button
                  key={preset.duration}
                  type="button"
                  onClick={() => applyPreset(preset.duration)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-full border transition-all shadow-sm',
                    isEditing && hasBookings
                      ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed hidden'
                      : duration === preset.duration
                        ? 'bg-primary-500 border-primary-500 text-white shadow-primary-200/50'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'
                  )}
                  disabled={(isEditing && hasBookings) || isLoading}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Warnings */}
            {duration > 0 && (
              <p className="text-xs text-slate-500">
                ระยะเวลา: <span className="font-medium text-primary-600">{duration} นาที</span>
              </p>
            )}
            {hasConflict && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="w-3 h-3" />
                ช่วงเวลาซ้อนทับกับที่มีอยู่แล้ว
              </div>
            )}
            {duration <= 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 p-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" />
                เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น
              </div>
            )}
          </div>

          {/* Capacity */}
          <div className="space-y-4 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-base font-bold text-slate-700">
              <div className="p-1.5 bg-white shadow-sm rounded-lg border border-slate-100">
                <Users className="w-5 h-5 text-primary-500" />
              </div>
              จำนวนที่รับได้ (Capacity)
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              {Array.from({ length: Math.min(5, maxTotalCapacity) }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFormData({ ...formData, maxCapacity: n })}
                  className={cn(
                    'w-10 h-10 rounded-xl border text-sm font-bold transition-all flex items-center justify-center shadow-sm',
                    formData.maxCapacity === n
                      ? 'bg-primary-500 border-primary-500 text-white shadow-primary-200/50'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'
                  )}
                  disabled={isLoading}
                >
                  {n}
                </button>
              ))}
              <div className="relative ml-2">
                <input
                  type="number"
                  min={Math.max(1, editingSlot?.bookedCount ?? 1)}
                  max={maxTotalCapacity}
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({
                    ...formData,
                    maxCapacity: Math.min(maxTotalCapacity, Math.max(1, parseInt(e.target.value) || 1))
                  })}
                  className="w-20 pl-3 pr-8 py-2.5 text-sm font-bold border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none shadow-sm text-center"
                  disabled={isLoading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">คน</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
            {/* Delete Button (editing only) */}
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading || hasBookings}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-xl transition-colors shrink-0',
                  hasBookings
                    ? 'text-slate-400 cursor-not-allowed hidden'
                    : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                )}
              >
                <Trash2 className="w-4 h-4" />
                ลบ
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl px-4 sm:px-5 font-bold text-slate-600 shrink-0"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="bg-primary-600 hover:bg-primary-700 rounded-xl px-4 sm:px-6 shadow-sm shadow-primary-500/30 font-bold shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <div className="flex items-center">
                    <Save className="w-4 h-4 mr-1.5" />
                    บันทึก
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 mr-1.5" />
                    เพิ่ม
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default SlotFormModal;