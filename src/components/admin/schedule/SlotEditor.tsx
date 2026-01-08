// src/components/admin/schedule/SlotEditor.tsx

'use client';

import { Card, Button, LoadingSpinner } from '@/components/ui';
import { List, CheckCircle2, Ban, Plus, Clock, Trash2 } from 'lucide-react';
import { getThaiDayName } from '@/lib/date';
import { cn } from '@/lib/cn';
import { SlotCard } from './SlotCard';
import type { TimeSlot, Booking } from '@/types';

interface SlotEditorProps {
  selectedDate: Date;
  slots: TimeSlot[];
  bookings: Booking[];
  dayStatus: { isClosed: boolean; reason?: string } | null;
  isLoading: boolean;
  isToggling: boolean;
  isDeleting: boolean;
  onToggleDayStatus: () => void;
  onDeleteAllSlots: () => void;
  onAddSlot: () => void;
  onEditSlot: (index: number) => void;
  onDeleteSlot: (index: number) => void;
  // ✅ เพิ่ม callback สำหรับเปิด/ปิดเฉพาะช่วงเวลา
  onToggleSlotAvailability?: (index: number, next: boolean) => void;
  onAssignBooking?: (bookingId: string) => void;
  onRescheduleBooking?: (booking: Booking) => void;
}

export function SlotEditor({
  selectedDate,
  slots,
  bookings,
  dayStatus,
  isLoading,
  isToggling,
  isDeleting,
  onToggleDayStatus,
  onDeleteAllSlots,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onToggleSlotAvailability,
  onAssignBooking: _onAssignBooking,
  onRescheduleBooking: _onRescheduleBooking,
}: SlotEditorProps) {
  return (
    <div className="space-y-4">
      {/* Day Status Header */}
      <Card className="px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-gray-200 shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 bg-gray-100 rounded-lg text-gray-600">
            <span className="text-[10px] uppercase font-bold">
              {getThaiDayName(selectedDate, 'short')}
            </span>
            <span className="text-xl font-bold leading-none">
              {selectedDate.getDate()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {getThaiDayName(selectedDate, 'full')}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <List className="w-3.5 h-3.5" />
              <span>{slots.length} ช่วงเวลา</span>
              {dayStatus?.isClosed && (
                <span className="text-red-500 font-medium">
                  (ปิดให้บริการ)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onToggleDayStatus}
            disabled={isToggling}
            className={cn(
              'flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 border',
              dayStatus?.isClosed
                ? 'bg-white border-green-200 text-green-700 hover:bg-green-50'
                : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
            )}
          >
            {isToggling ? (
              <LoadingSpinner size="sm" />
            ) : dayStatus?.isClosed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                เปิดวันทำการ
              </>
            ) : (
              <>
                <Ban className="w-3.5 h-3.5" />
                ปิดทั้งวัน
              </>
            )}
          </button>
        </div>
      </Card>

      {/* Slots Content */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : dayStatus?.isClosed ? (
        <div className="py-16 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Ban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">วันนี้ปิดให้บริการ</p>
          <p className="text-xs text-gray-400 mt-1">
            กด &quot;เปิดวันทำการ&quot; เพื่อจัดการเวลา
          </p>
        </div>
      ) : (
        <Card className="p-4 border-gray-200 shadow-sm min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
              รายการช่วงเวลา
            </h3>
            <div className="flex gap-2">
              {slots.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 text-xs"
                  onClick={onDeleteAllSlots}
                  isLoading={isDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> ลบทั้งหมด
                </Button>
              )}
              <Button
                size="sm"
                onClick={onAddSlot}
                className="h-8 text-xs px-3 bg-gray-800 hover:bg-gray-900 text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> เพิ่มช่วงเวลา
              </Button>
            </div>
          </div>

          {slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">
                ยังไม่มีช่วงเวลา
              </p>
              <p className="text-xs text-gray-400">
                กดปุ่ม &quot;เพิ่มช่วงเวลา&quot; ด้านบน
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {slots.map((slot, idx) => (
                <div
                  key={`${slot.startTime}-${idx}`}
                  className="flex flex-col gap-1"
                >
                  {/* การ์ดช่วงเวลาเดิม */}
                  <SlotCard
                    slot={slot}
                    index={idx}
                    onEdit={onEditSlot}
                    onDelete={onDeleteSlot}
                  />

                  {/* ✅ ปุ่มเปิด/ปิดเฉพาะช่วงเวลา */}
                  {onToggleSlotAvailability && (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleSlotAvailability(idx, !slot.isAvailable)
                      }
                      className={cn(
                        'text-[10px] font-medium px-2 py-1 rounded-full border transition-all',
                        slot.isAvailable
                          ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      )}
                    >
                      {slot.isAvailable ? 'ปิดช่วงเวลานี้' : 'เปิดช่วงเวลานี้'}
                    </button>
                  )}
                </div>
              ))}

              {/* Quick Add Button */}
              <button
                onClick={onAddSlot}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-gray-200 text-gray-400 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all min-h-[80px] group"
              >
                <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium">เพิ่ม</span>
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
