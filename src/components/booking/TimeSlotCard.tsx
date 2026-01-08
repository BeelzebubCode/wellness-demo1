'use client';

import { cn } from '@/lib/cn';
import type { TimeSlot } from '@/features/booking/types';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export interface TimeSlotCardProps {
  slot: TimeSlot;
  onSelect: () => void;
  disabled?: boolean;
  showEndTime?: boolean;
}

export function TimeSlotCard({
  slot,
  onSelect,
  disabled = false,
  showEndTime = true,
}: TimeSlotCardProps) {
  const isAvailable = slot.isAvailable && !disabled;
  const isFull = !slot.isAvailable;

  const total = Number(slot.maxCapacity ?? 1);     // ✅ จาก DB
  const booked = Number(slot.bookedCount ?? 0);    // ✅ จาก DB

  // ✅ format ที่คุณอยากได้: ว่าง 0/2
  const queueText = `${booked}/${total}`;

  return (
    <button
      onClick={onSelect}
      disabled={!isAvailable}
      className={cn(
        'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        isAvailable && [
          'bg-gradient-to-br from-green-50 to-emerald-50',
          'border-green-200 hover:border-green-400',
          'hover:shadow-md hover:scale-[1.02]',
          'focus:ring-green-500',
          'group',
        ],
        !isAvailable && [
          'bg-gray-50 border-gray-200',
          'cursor-not-allowed opacity-60',
        ],
      )}
    >
      <div className="mb-2">
        <span
          className={cn(
            'text-lg font-bold',
            isAvailable ? 'text-green-700 group-hover:text-green-800' : 'text-gray-400',
          )}
        >
          {slot.startTime}
        </span>

        {showEndTime && (
          <span className={cn('text-sm ml-1', isAvailable ? 'text-green-600' : 'text-gray-400')}>
            - {slot.endTime}
          </span>
        )}
      </div>

      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
          isAvailable && 'bg-green-100 text-green-700',
          isFull && 'bg-red-100 text-red-700',
          disabled && !isFull && 'bg-amber-100 text-amber-700',
        )}
      >
        {isFull ? (
          <>
            <XCircle className="w-3.5 h-3.5" />
            <span>เต็ม {queueText}</span>
          </>
        ) : disabled ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>มีคิวค้าง</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-3.5 h-3.5" />
            <span>ว่าง {queueText}</span>
          </>
        )}
      </div>

      {isAvailable && (
        <div className="absolute inset-0 rounded-xl border-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
