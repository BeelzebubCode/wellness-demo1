// src/components/admin/data-center/tables/BookingsTable.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/shared/Avatar';
import StatusBadge from '@/components/shared/StatusBadge';
import BookingDetailModal from '../modals/BookingDetailModal';
import type { BookingItem, PaginatedResponse } from '@/features/data-center/types';

const PAGE_SIZE = 20;

export default function BookingsTable() {
  const [data, setData] = useState<PaginatedResponse<BookingItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', PAGE_SIZE.toString());
      if (search) params.set('search', search);
      if (status && status !== 'ALL') params.set('status', status);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/data-center/bookings?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Export CSV
  const handleExport = () => {
    if (!data?.data || data.data.length === 0) return;

    const headers = ['ID', 'วันที่', 'เวลา', 'นักเรียน', 'รหัส', 'ผู้ให้คำปรึกษา', 'หัวข้อ', 'สถานะ'];
    const rows = data.data.map((item) => [
      item.id,
      item.date,
      item.timeSlot,
      item.studentName,
      item.studentCode,
      item.consultantName,
      item.problemType,
      item.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookings_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="ค้นหา ชื่อ / รหัสนิสิต / ผู้ให้คำปรึกษา"
              className="bg-transparent outline-none text-sm w-full"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status */}
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="PENDING_ASSIGNMENT">รอมอบหมาย</option>
            <option value="ASSIGNED">มอบหมายแล้ว</option>
            <option value="IN_PROGRESS">กำลังดำเนินการ</option>
            <option value="COMPLETED">เสร็จสิ้น</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />

          {/* Export */}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
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
                        {/* Date */}
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.date}</div>
                          <div className="text-gray-500 text-xs mt-0.5">{item.timeSlot}</div>
                        </td>

                        {/* Student */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={item.studentName} className="w-8 h-8 text-xs" />
                            <div>
                              <div className="font-medium text-gray-900">{item.studentName}</div>
                              <div className="text-xs text-gray-500">{item.studentCode}</div>
                            </div>
                          </div>
                        </td>

                        {/* Consultant */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={item.consultantName}
                              className="w-8 h-8 text-xs bg-indigo-100 text-indigo-700"
                            />
                            <div className="font-medium text-gray-900">{item.consultantName}</div>
                          </div>
                        </td>

                        {/* Topic */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.problemType}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Actions */}
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
      </div>

      {/* Detail Modal */}
      <BookingDetailModal bookingId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}