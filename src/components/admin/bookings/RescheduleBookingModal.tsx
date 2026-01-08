'use client';

import { useEffect, useState } from 'react';
import { Modal, Button } from '@/components/ui';
import type { Booking } from '@/types';

export interface ReschedulePayload {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export function RescheduleBookingModal({
  booking,
  onClose,
  onConfirm,
}: {
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (payload: ReschedulePayload) => void;
}) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (booking) {
      setDate(booking.date ?? '');
      setStartTime(booking.startTime ?? '');
      setEndTime(booking.endTime ?? '');
      setReason('');
    }
  }, [booking]);

  if (!booking) return null;

  return (
    <Modal isOpen={!!booking} onClose={onClose} title="เลื่อนเวลานัด" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm({ date, startTime, endTime, reason });
        }}
        className="space-y-4"
      >
        <p className="text-xs text-gray-500">
          กำลังเลื่อนคิวของ{' '}
          <span className="font-semibold text-gray-800">
            {booking.userName ?? 'ไม่ทราบชื่อ'}
          </span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">วันที่ใหม่</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">เวลาเริ่มต้น</label>
            <input
              type="time"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">เวลาสิ้นสุด</label>
            <input
              type="time"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">เหตุผลในการเลื่อนนัด</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            placeholder="ระบุสาเหตุ เช่น ผู้ให้คำปรึกษาติดภารกิจ / ปรับเวลาให้เหมาะกับนิสิต ฯลฯ"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600">
            ยืนยันการเลื่อนนัด
          </Button>
        </div>
      </form>
    </Modal>
  );
}
