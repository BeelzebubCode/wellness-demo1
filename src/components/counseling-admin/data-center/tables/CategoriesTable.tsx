// src/components/admin/data-center/tables/CategoriesTable.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import CategoryDetailModal from '../modals/CategoryDetailModal';
import type { CategoryItem, PaginatedResponse, DataCenterFilter } from '@/features/data-center/types';

const PAGE_SIZE = 20;

interface Props {
  filters: DataCenterFilter;
}

export default function CategoriesTable({ filters }: Props) {
  const [data, setData] = useState<PaginatedResponse<CategoryItem> | null>(null);
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

      const res = await fetch(`/api/admin/data-center/categories?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
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

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

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
                  <th className="px-6 py-4">รหัส</th>
                  <th className="px-6 py-4">ชื่อประเภท</th>
                  <th className="px-6 py-4">คำอธิบาย</th>
                  <th className="px-6 py-4 text-center">จำนวนจอง</th>
                  <th className="px-6 py-4 text-center">รอดำเนินการ</th>
                  <th className="px-6 py-4 text-center">อัตราสำเร็จ</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  data?.data.map((item) => {
                    const successRate = getPercentage(item.completedCount, item.totalBookings);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 text-sm">
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                            {item.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.nameTh}</div>
                          {item.nameEn && (
                            <div className="text-xs text-gray-400">{item.nameEn}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs">
                          <div className="truncate">{item.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-gray-800">{item.totalBookings}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`font-medium ${
                              item.pendingCount > 0 ? 'text-amber-600' : 'text-gray-400'
                            }`}
                          >
                            {item.pendingCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full"
                                style={{ width: `${successRate}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-10">{successRate}%</span>
                          </div>
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
                    );
                  })
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

      <CategoryDetailModal categoryId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}