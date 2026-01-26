// src/components/admin/data-center/tables/StudentsTable.tsx

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Spinner } from "@/components/ui/Spinner";
import Avatar from "@/components/shared/Avatar";
import StudentDetailModal from "../modals/StudentDetailModal";
import type {
  StudentItem,
  PaginatedResponse,
  DataCenterFilter,
} from "@/features/data-center/types";

const PAGE_SIZE = 20;

interface Props {
  filters: DataCenterFilter;
}

const EMPTY_META = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export default function StudentsTable({ filters }: Props) {
  const [data, setData] = useState<PaginatedResponse<StudentItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const rows = useMemo(() => data?.data ?? [], [data]);
  const meta = useMemo(() => data?.meta ?? EMPTY_META, [data]);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", PAGE_SIZE.toString());

        // Apply filters
        if (filters.search) params.set("search", filters.search);
        if (filters.facultyId) params.set("facultyId", String(filters.facultyId));
        if (filters.departmentId) params.set("departmentId", String(filters.departmentId));
        if (filters.year) params.set("year", String(filters.year));
        if (filters.degree) params.set("degree", filters.degree);
        if (filters.studentCode) params.set("studentCode", filters.studentCode);
        if (filters.bookingCountMin)
          params.set("bookingCountMin", String(filters.bookingCountMin));
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const res = await fetch(`/api/admin/data-center/students?${params}`, { signal });
        const json = await res.json().catch(() => null);

        // ถ้าโดน abort ให้เงียบ ๆ
        if (signal?.aborted) return;

        // กัน API error / shape ไม่ตรง
        if (!res.ok || !json || !Array.isArray(json.data)) {
          console.error("Students API error:", { status: res.status, json });
          setData({
            data: [],
            meta: {
              page,
              limit: PAGE_SIZE,
              total: 0,
              totalPages: 1,
            },
          } as PaginatedResponse<StudentItem>);
          return;
        }

        setData(json);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Failed to fetch students:", err);

        // fail-safe
        setData({
          data: [],
          meta: {
            page,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 1,
          },
        } as PaginatedResponse<StudentItem>);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, filters]
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Fetch data (debounce + cancel previous)
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => fetchData(controller.signal), 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
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
                  <th className="px-6 py-4">นิสิต</th>
                  <th className="px-6 py-4">คณะ / สาขา</th>
                  <th className="px-6 py-4 text-center">จำนวนจอง</th>
                  <th className="px-6 py-4 text-center">เสร็จสิ้น</th>
                  <th className="px-6 py-4 text-center">ยกเลิก</th>
                  <th className="px-6 py-4">จองล่าสุด</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  rows.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 text-sm">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={item.name} className="w-8 h-8 text-xs" />
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.code || "-"}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        <div>{item.faculty || "-"}</div>
                        <div className="text-xs text-gray-400">{item.department || "-"}</div>
                      </td>

                      <td className="px-6 py-4 text-center font-medium">{item.bookingCount}</td>
                      <td className="px-6 py-4 text-center text-emerald-600">
                        {item.completedCount}
                      </td>
                      <td className="px-6 py-4 text-center text-rose-600">
                        {item.cancelledCount}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{item.lastBookingDate || "-"}</td>

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
                แสดง {(page - 1) * PAGE_SIZE + 1} ถึง{" "}
                {Math.min(page * PAGE_SIZE, meta.total)} จาก {meta.total} รายการ
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
                  disabled={page >= meta.totalPages}
                  className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 text-sm"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <StudentDetailModal studentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
