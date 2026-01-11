// src/components/admin/data-center/modals/BookingDetailModal.tsx

'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import StatusBadge from '@/components/shared/StatusBadge';
import type { BookingDetail } from '@/features/data-center/types';

interface Props {
  bookingId: number | null;
  onClose: () => void;
}

export default function BookingDetailModal({ bookingId, onClose }: Props) {
  const [data, setData] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    setLoading(true);
    fetch(`/api/admin/data-center/bookings/${bookingId}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookingId]);

  return (
    <Modal isOpen={!!bookingId} onClose={onClose} title="รายละเอียดการนัดหมาย" size="lg">
      {loading ? (
        <div className="p-10 flex justify-center">
          <Spinner />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Status & Date */}
          <div className="flex items-center justify-between">
            <StatusBadge status={data.status} />
            <div className="text-sm text-gray-500">
              {data.date} | {data.timeSlot}
            </div>
          </div>

          {/* Problem Type */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">หัวข้อปัญหา</div>
            <div className="font-medium text-gray-800">{data.problemType}</div>
            {data.detailText && (
              <div className="mt-2 text-sm text-gray-600">{data.detailText}</div>
            )}
          </div>

          {/* Student & Consultant */}
          <div className="grid grid-cols-2 gap-4">
            {/* Student */}
            <div className="border rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-2">ข้อมูลนิสิต</div>
              <div className="space-y-1 text-sm">
                <div className="font-medium text-gray-800">{data.student.name}</div>
                <div className="text-gray-500">รหัส: {data.student.code || '-'}</div>
                <div className="text-gray-500">อีเมล: {data.student.email || '-'}</div>
                <div className="text-gray-500">โทร: {data.student.phone || '-'}</div>
                <div className="text-gray-500">คณะ: {data.student.faculty || '-'}</div>
              </div>
            </div>

            {/* Consultant */}
            <div className="border rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-2">ผู้ให้คำปรึกษา</div>
              {data.consultant ? (
                <div className="space-y-1 text-sm">
                  <div className="font-medium text-gray-800">{data.consultant.name}</div>
                  <div className="text-gray-500">อีเมล: {data.consultant.email || '-'}</div>
                  <div className="text-gray-500">โทร: {data.consultant.phone || '-'}</div>
                  <div className="text-gray-500">สังกัด: {data.consultant.organization || '-'}</div>
                </div>
              ) : (
                <div className="text-amber-600 text-sm">ยังไม่มอบหมาย</div>
              )}
            </div>
          </div>

          {/* Outcome */}
          {data.outcome && (
            <div className="border rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-2">ผลการให้คำปรึกษา</div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">บันทึก:</span>
                  <p className="text-gray-800 mt-1">{data.outcome.note}</p>
                </div>
                {data.outcome.nextStep && (
                  <div>
                    <span className="text-gray-500">ขั้นตอนถัดไป:</span>
                    <p className="text-gray-800 mt-1">{data.outcome.nextStep}</p>
                  </div>
                )}
                {data.outcome.riskLevel != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">ระดับความเสี่ยง:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        data.outcome.riskLevel >= 4
                          ? 'bg-rose-100 text-rose-700'
                          : data.outcome.riskLevel >= 2
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {data.outcome.riskLevel}/5
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancellation */}
          {data.cancellation && (
            <div className="border border-rose-200 bg-rose-50 rounded-xl p-4">
              <div className="text-xs text-rose-600 mb-2">ข้อมูลการยกเลิก</div>
              <div className="space-y-1 text-sm">
                <div className="text-gray-800">เหตุผล: {data.cancellation.reason}</div>
                <div className="text-gray-500">
                  ยกเลิกโดย: {data.cancellation.cancelledBy}
                </div>
                <div className="text-gray-500">เมื่อ: {data.cancellation.cancelledAt}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-400">ไม่พบข้อมูล</div>
      )}
    </Modal>
  );
}