// src/components/admin/data-center/modals/StudentDetailModal.tsx

'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import StatusBadge from '@/components/shared/StatusBadge';
import type { StudentDetail } from '@/features/data-center/types';

interface Props {
  studentId: number | null;
  onClose: () => void;
}

export default function StudentDetailModal({ studentId, onClose }: Props) {
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    setLoading(true);
    fetch(`/api/admin/data-center/students/${studentId}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <Modal isOpen={!!studentId} onClose={onClose} title="ข้อมูลนิสิต" size="lg">
      {loading ? (
        <div className="p-10 flex justify-center">
          <Spinner />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">ชื่อ-สกุล</div>
              <div className="font-medium">{data.name}</div>
            </div>
            <div>
              <div className="text-gray-500">รหัสนิสิต</div>
              <div className="font-medium">{data.code || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">อีเมล</div>
              <div className="font-medium">{data.email || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">เบอร์โทร</div>
              <div className="font-medium">{data.phone || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">คณะ</div>
              <div className="font-medium">{data.faculty || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">สาขา</div>
              <div className="font-medium">{data.department || '-'}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">{data.bookingCount}</div>
              <div className="text-xs text-gray-500">จองทั้งหมด</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{data.completedCount}</div>
              <div className="text-xs text-gray-500">เสร็จสิ้น</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-rose-600">{data.cancelledCount}</div>
              <div className="text-xs text-gray-500">ยกเลิก</div>
            </div>
          </div>

          {/* Booking History */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">ประวัติการจอง</h3>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">วันที่</th>
                    <th className="px-4 py-2 text-left">เรื่อง</th>
                    <th className="px-4 py-2 text-left">ที่ปรึกษา</th>
                    <th className="px-4 py-2 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.bookings?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        ไม่มีประวัติการจอง
                      </td>
                    </tr>
                  ) : (
                    data.bookings?.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div>{b.date}</div>
                          <div className="text-xs text-gray-400">{b.time}</div>
                        </td>
                        <td className="px-4 py-2">{b.problemType}</td>
                        <td className="px-4 py-2">{b.consultantName}</td>
                        <td className="px-4 py-2 text-center">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-gray-400">ไม่พบข้อมูล</div>
      )}
    </Modal>
  );
}