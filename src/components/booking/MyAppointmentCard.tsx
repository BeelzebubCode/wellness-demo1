'use client';

import { cn } from '@/lib/cn';
import { formatThaiDate } from '@/lib/date';
import { BOOKING_STATUS } from '@/lib/constants';
import { Card, Button } from '@/components/ui';
import type { Booking } from '@/features/booking/types';
import { Clock, XCircle } from 'lucide-react';

export interface MyAppointmentCardProps {
  booking: Booking;
  onCancel?: () => void;
  isCompact?: boolean;
}

export function MyAppointmentCard({
  booking,
  onCancel,
  isCompact = false,
}: MyAppointmentCardProps) {
  const statusConfig =
    BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS];
  const StatusIcon = statusConfig.icon;

  const hasDate =
    !!booking.date && !!booking.startTime && !!booking.endTime;

  /* ======================================================
     ✅ COMPACT MODE (History)
  ====================================================== */
  if (isCompact) {
    return (
      <div className="border rounded-xl bg-white px-4 py-3 hover:bg-gray-50 transition">
        <div className="flex items-start justify-between gap-4">
          {/* LEFT */}
          <div className="flex items-start gap-3">
            {/* Date */}
            {booking.date && (
              <div className="text-center w-10 flex-shrink-0">
                <div className="text-xs text-gray-500">
                  {new Date(booking.date).toLocaleDateString('th-TH', {
                    weekday: 'short',
                  })}
                </div>
                <div className="text-lg font-semibold text-gray-800">
                  {new Date(booking.date).getDate()}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <StatusIcon className="w-4 h-4 text-gray-500" />
                <span>{statusConfig.label}</span>
              </div>

              {hasDate && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {booking.startTime} – {booking.endTime} น.
                </div>
              )}

              {booking.problemType && (
                <div className="text-xs text-gray-600">
                  {booking.problemType}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="text-xs text-gray-400">
            #{String(booking.id).padStart(6, '0')}
          </div>
        </div>
      </div>
    );
  }

  /* ======================================================
     NORMAL MODE (Active booking)
  ====================================================== */
  return (
    <Card className="overflow-hidden" padding="md">
      <div className={cn('px-4 py-2', statusConfig.bgColor)}>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'text-sm font-medium flex items-center gap-2',
              statusConfig.textColor
            )}
          >
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </span>
          <span className="text-xs text-gray-500">
            #{String(booking.id).padStart(6, '0')}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {hasDate && (
          <div>
            <p className="font-semibold text-gray-800">
              {formatThaiDate(new Date(booking.date!))}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Clock className="w-4 h-4" />
              {booking.startTime} – {booking.endTime} น.
            </p>
          </div>
        )}

        {booking.problemType && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">ประเภทปัญหา</p>
            <p className="text-sm text-gray-700">
              {booking.problemType}
            </p>
          </div>
        )}

        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
          >
            <XCircle className="w-4 h-4" />
            ยกเลิกการจอง
          </Button>
        )}
      </div>
    </Card>
  );
}
