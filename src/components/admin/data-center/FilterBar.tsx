"use client";

import { useState, useEffect } from "react";
import { DataCenterFilter } from "@/types/data-center";
import { Button } from "@/components/ui/Button";
import { Search, Filter, X, Download } from "lucide-react";

interface FilterBarProps {
  onFilterChange: (filters: DataCenterFilter) => void;
  onExport: () => void;
  isLoading: boolean;
}

const INITIAL_FILTERS: DataCenterFilter = {
  search: "",
  status: "ALL",
  startDate: "",
  endDate: "",
};

export default function FilterBar({
  onFilterChange,
  onExport,
  isLoading,
}: FilterBarProps) {
  const [filters, setFilters] = useState<DataCenterFilter>(INITIAL_FILTERS);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  /* ---------------- Debounce Filter ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 400);

    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  /* ---------------- Handlers ---------------- */
  const handleChange = <K extends keyof DataCenterFilter>(
    key: K,
    value: DataCenterFilter[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    onFilterChange(INITIAL_FILTERS);
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          ตัวกรองข้อมูล
        </h3>

        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={() => setIsExpanded(v => !v)}
            className="text-sm text-gray-500 hover:text-indigo-600 underline"
          >
            {isExpanded ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
          </button>

          <Button variant="outline" size="sm" onClick={handleReset}>
            <X className="w-4 h-4 mr-1" />
            ล้างค่า
          </Button>
        </div>
      </div>

      {/* Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              ค้นหา (ชื่อ, อีเมล)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleChange("search", e.target.value)}
                placeholder="พิมพ์ชื่อ นามสกุล หรืออีเมล..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              สถานะ
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                handleChange("status", e.target.value as DataCenterFilter["status"])
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="PENDING_ASSIGNMENT">รอจัดสรร</option>
              <option value="ASSIGNED">มอบหมายแล้ว</option>
              <option value="IN_PROGRESS">กำลังดำเนินการ</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              ตั้งแต่วันที่
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              ถึงวันที่
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Export */}
          <div className="md:col-span-2 lg:col-span-4 flex justify-end pt-4 border-t border-gray-50">
            <Button
              onClick={onExport}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
