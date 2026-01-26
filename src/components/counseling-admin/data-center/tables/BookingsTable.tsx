// src/components/admin/data-center/tables/BookingsTable.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import Avatar from '@/components/shared/Avatar';
import StatusBadge from '@/components/shared/StatusBadge';
import BookingDetailModal from '../modals/BookingDetailModal';
import type { BookingItem, PaginatedResponse, DataCenterFilter } from '@/features/data-center/types';

const PAGE_SIZE = 20;

interface Props {
  filters: DataCenterFilter;
}

export default function BookingsTable({ filters }: Props) {
  const [data, setData] = useState<PaginatedResponse<BookingItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', PAGE_SIZE.toString());

      if (filters.search) params.set('search', filters.search);
      if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters.problemCategoryId) params.set('problemCategoryId', String(filters.problemCategoryId));
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await fetch(`/api/admin/data-center/bookings?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {loading ? (
        <div className="p-20 flex justify-center">
          <Spinner className="w-8 h-8 text-indigo-600" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-4">วันที่ / เวลา</th>
                  <th className="px-6 py-4">นักเรียน</th>
                  <th className="px-6 py-4">ผู้ให้คำปรึกษา</th>
                  <th className="px-6 py-4">หัวข้อ</th>
                  <th className="px-6 py-4 text-center">สถานะ</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  data?.data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 text-sm">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.date}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{item.timeSlot}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={item.studentName} className="w-8 h-8 text-xs" />
                          <div>
                            <div className="font-medium text-gray-900">{item.studentName}</div>
                            <div className="text-xs text-gray-500">{item.studentCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={item.consultantName}
                            className="w-8 h-8 text-xs bg-indigo-100 text-indigo-700"
                          />
                          <div className="font-medium text-gray-900">{item.consultantName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.problemType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedId(item.id)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.meta && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/30">
              <div className="text-sm text-gray-500">
                แสดง {(page - 1) * PAGE_SIZE + 1} ถึง{' '}
                {Math.min(page * PAGE_SIZE, data.meta.total)} จาก {data.meta.total} รายการ
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 text-sm"
                >
                  ก่อนหน้า
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.meta.totalPages}
                  className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 text-sm"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <BookingDetailModal bookingId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}