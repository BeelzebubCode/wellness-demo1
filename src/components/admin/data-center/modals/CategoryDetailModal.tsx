// src/components/admin/data-center/modals/CategoryDetailModal.tsx

'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import type { CategoryDetail } from '@/features/data-center/types';

interface Props {
  categoryId: number | null;
  onClose: () => void;
}

export default function CategoryDetailModal({ categoryId, onClose }: Props) {
  const [data, setData] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) return;

    setLoading(true);
    fetch(`/api/admin/data-center/categories/${categoryId}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryId]);

  return (
    <Modal isOpen={!!categoryId} onClose={onClose} title="ข้อมูลประเภทเรื่อง" size="lg">
      {loading ? (
        <div className="p-10 flex justify-center">
          <Spinner />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">รหัส</div>
              <div className="font-medium font-mono">{data.code}</div>
            </div>
            <div>
              <div className="text-gray-500">ชื่อภาษาไทย</div>
              <div className="font-medium">{data.nameTh}</div>
            </div>
            <div>
              <div className="text-gray-500">ชื่อภาษาอังกฤษ</div>
              <div className="font-medium">{data.nameEn || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">คำอธิบาย</div>
              <div className="font-medium">{data.description || '-'}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">{data.totalBookings}</div>
              <div className="text-xs text-gray-500">จองทั้งหมด</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{data.pendingCount}</div>
              <div className="text-xs text-gray-500">รอดำเนินการ</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{data.completedCount}</div>
              <div className="text-xs text-gray-500">เสร็จสิ้น</div>
            </div>
          </div>

          {/* Monthly Stats */}
          {data.monthlyStats && data.monthlyStats.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">สถิติรายเดือน</h3>
              <div className="grid grid-cols-6 gap-2">
                {data.monthlyStats.map((m, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-500">{m.month}</div>
                    <div className="font-semibold text-gray-800">{m.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Consultants */}
          {data.topConsultants && data.topConsultants.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">ผู้ให้คำปรึกษาที่รับเรื่องมากที่สุด</h3>
              <div className="space-y-2">
                {data.topConsultants.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </span>
                      <span className="font-medium text-gray-800">{c.name}</span>
                    </div>
                    <span className="text-gray-600">{c.count} ครั้ง</span>
                  </div>
                ))}
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