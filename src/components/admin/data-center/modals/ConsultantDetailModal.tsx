// src/components/admin/data-center/modals/ConsultantDetailModal.tsx

'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import StatusBadge from '@/components/shared/StatusBadge';
import type { ConsultantDetail } from '@/features/data-center/types';

interface Props {
  consultantId: number | null;
  onClose: () => void;
}

export default function ConsultantDetailModal({ consultantId, onClose }: Props) {
  const [data, setData] = useState<ConsultantDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!consultantId) return;

    setLoading(true);
    fetch(`/api/admin/data-center/consultants/${consultantId}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [consultantId]);

  return (
    <Modal isOpen={!!consultantId} onClose={onClose} title="ข้อมูลผู้ให้คำปรึกษา" size="lg">
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
              <div className="text-gray-500">สังกัด</div>
              <div className="font-medium">{data.organization}</div>
            </div>
            <div>
              <div className="text-gray-500">อีเมล</div>
              <div className="font-medium">{data.email || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">เบอร์โทร</div>
              <div className="font-medium">{data.phone || '-'}</div>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <div className="text-gray-500 text-sm mb-2">ความเชี่ยวชาญ</div>
            <div className="flex flex-wrap gap-2">
              {data.specializations.length > 0 ? (
                data.specializations.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">ไม่ระบุ</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{data.activeQueueCount}</div>
              <div className="text-xs text-gray-500">คิวปัจจุบัน</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">{data.totalBookings}</div>
              <div className="text-xs text-gray-500">ทั้งหมด</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{data.completedBookings}</div>
              <div className="text-xs text-gray-500">เสร็จสิ้น</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 flex items-center justify-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                {data.avgRating || '-'}
              </div>
              <div className="text-xs text-gray-500">คะแนนเฉลี่ย</div>
            </div>
          </div>

          {/* Ratings by Criterion */}
          {data.ratings && data.ratings.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">คะแนนตามเกณฑ์</h3>
              <div className="space-y-2">
                {data.ratings.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{r.criterion}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-amber-400 h-2 rounded-full"
                          style={{ width: `${(r.avgScore / 5) * 100}%` }}
                        />
                      </div>
                      <span className="font-medium w-8">{r.avgScore}</span>
                      <span className="text-gray-400 text-xs">({r.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Bookings */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">ประวัติการให้คำปรึกษา</h3>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">วันที่</th>
                    <th className="px-4 py-2 text-left">นิสิต</th>
                    <th className="px-4 py-2 text-left">เรื่อง</th>
                    <th className="px-4 py-2 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.recentBookings?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        ไม่มีประวัติ
                      </td>
                    </tr>
                  ) : (
                    data.recentBookings?.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{b.date}</td>
                        <td className="px-4 py-2">{b.studentName}</td>
                        <td className="px-4 py-2">{b.problemType}</td>
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