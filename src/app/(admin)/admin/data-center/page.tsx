"use client";

import { useState, useEffect, useCallback } from "react";
import FilterBar from "@/components/admin/data-center/FilterBar";
import { DataCenterResponse, DataCenterFilter } from "@/types/data-center";
import { Spinner } from "@/components/ui/Spinner";
import StatusBadge from "@/components/shared/StatusBadge";
import Avatar from "@/components/shared/Avatar";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const PAGE_SIZE = 20;

export default function DataCenterPage() {
  const [data, setData] = useState<DataCenterResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentFilters, setCurrentFilters] = useState<DataCenterFilter>({});
  const [page, setPage] = useState<number>(1);

  /* ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", PAGE_SIZE.toString());

      if (currentFilters.search) params.set("search", currentFilters.search);
      if (currentFilters.status && currentFilters.status !== "ALL") {
        params.set("status", currentFilters.status);
      }
      if (currentFilters.startDate) params.set("startDate", currentFilters.startDate);
      if (currentFilters.endDate) params.set("endDate", currentFilters.endDate);

      const res = await fetch(`/api/admin/data-center?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch data center");

      const json: DataCenterResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error("❌ DataCenter fetch error:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, currentFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------- Export CSV ---------------- */
  const handleExport = () => {
    if (!data?.data || data.data.length === 0) return;

    const headers = [
      "ID",
      "วันที่",
      "เวลา",
      "นักเรียน",
      "ผู้ให้คำปรึกษา",
      "หัวข้อ",
      "สถานะ",
      "Meeting Link",
    ];

    const rows = data.data.map(item => [
        item.id,
        item.date,        // ✅ เป็น string ที่ format มาแล้ว
        item.timeSlot,    // ✅ เช่น "10:00 - 11:00"
        item.studentName,
        item.consultantName,
        item.problemType,
        item.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data_center_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Data Center</h1>
        <p className="text-gray-500 text-sm mt-1">
          ศูนย์รวมข้อมูลการนัดหมายและการจัดการข้อมูลระบบ
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        onFilterChange={(filters) => {
          setCurrentFilters(filters);
          setPage(1);
        }}
        onExport={handleExport}
        isLoading={loading}
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center items-center">
            <Spinner className="w-8 h-8 text-indigo-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                        ไม่พบข้อมูลตามเงื่อนไขที่กำหนด
                      </td>
                    </tr>
                  ) : (
                    data?.data.map(item => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/50 transition-colors text-sm"
                      >
                        {/* Date */}
                        <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                                {item.date}
                            </div>
                            <div className="text-gray-500 text-xs mt-0.5">
                                {item.timeSlot}
                            </div>
                        </td>


                        {/* Student */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                                src={undefined}
                                name={item.studentName || "S"}
                                className="w-8 h-8 text-xs"
                            />
                            <div>
                                <div className="font-medium text-gray-900">
                                    {item.studentName || "ไม่ระบุชื่อ"}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {item.studentId || "-"}
                                </div>
                            </div>
                          </div>
                        </td>

                        {/* Consultant */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                                src={undefined}
                                name={item.consultantName || "C"}
                                className="w-8 h-8 text-xs bg-indigo-100 text-indigo-700"
                            />
                            <div className="font-medium text-gray-900">
                                {item.consultantName || "-"}
                            </div>
                          </div>
                        </td>

                        {/* Topic */}
                        <td className="px-6 py-4 text-gray-600">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.problemType || "General"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-right">
                          <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                <div className="text-sm text-gray-500">
                  แสดง {(page - 1) * PAGE_SIZE + 1} ถึง{" "}
                  {Math.min(page * PAGE_SIZE, data.meta.total)} จาก{" "}
                  {data.meta.total} รายการ
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 text-sm"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
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
    </div>
  );
}
