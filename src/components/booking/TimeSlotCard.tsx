'use client';

import { cn } from '@/lib/cn';
import type { TimeSlot } from '@/features/booking/types';

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

  return (
    <button
      onClick={onSelect}
      disabled={!isAvailable}
      className={cn(
        'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',

        // Available
        isAvailable && [
          'bg-gradient-to-br from-green-50 to-emerald-50',
          'border-green-200 hover:border-green-400',
          'hover:shadow-md hover:scale-[1.02]',
          'focus:ring-green-500',
          'group',
        ],

        // Full / Disabled
        !isAvailable && [
          'bg-gray-50 border-gray-200',
          'cursor-not-allowed opacity-60',
        ],
      )}
    >
      {/* Time */}
      <div className="mb-2">
        <span
          className={cn(
            'text-lg font-bold',
            isAvailable
              ? 'text-green-700 group-hover:text-green-800'
              : 'text-gray-400',
          )}
        >
          {slot.startTime}
        </span>

        {showEndTime && (
          <span
            className={cn(
              'text-sm ml-1',
              isAvailable ? 'text-green-600' : 'text-gray-400',
            )}
          >
            - {slot.endTime}
          </span>
        )}
      </div>

      {/* Status Badge */}
      <div
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
          isAvailable && 'bg-green-100 text-green-700',
          isFull && 'bg-red-100 text-red-700',
          disabled && !isFull && 'bg-amber-100 text-amber-700',
        )}
      >
        {isFull ? (
          <>❌ เต็ม</>
        ) : disabled ? (
          <>⚠️ มีคิวค้าง</>
        ) : (
          <>✓ ว่าง</>
        )}
      </div>

      {/* Hover ring */}
      {isAvailable && (
        <div className="absolute inset-0 rounded-xl border-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
