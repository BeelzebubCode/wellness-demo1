"use client";

import { useAdvisorStats } from "../hooks/useAdvisorStats";
import { StudentListTable } from "./StudentListTable";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterDef } from "@/components/filters/types";
import { LoadingSpinner } from "@/components/ui";

const FILTER_DEFS: FilterDef<any>[] = [
  {
    key: "riskLevel",
    label: "ระดับความเสี่ยง",
    type: "select",
    options: [
        { label: "ทั้งหมด", value: "ALL" },
        { label: "🔴 เสี่ยงสูง (High)", value: "HIGH" },
        { label: "🟠 เสี่ยงปานกลาง (Medium)", value: "MEDIUM" },
        { label: "🟢 เสี่ยงต่ำ (Low)", value: "LOW" },
        { label: "⚪ ปกติ (Normal)", value: "NORMAL" },
    ],
    placeholder: "ทั้งหมด"
  }
];

export function MyStudentsPage() {
  const { students, isLoading, filters, setFilters } = useAdvisorStats();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">นิสิตในที่ปรึกษา (My Students)</h1>
        <p className="text-gray-500">จัดการและตรวจสอบข้อมูลนิสิตที่คุณดูแล</p>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <FilterBar 
            defs={FILTER_DEFS}
            value={filters}
            onChange={setFilters}
            searchKey="search"
            searchPlaceholder="ค้นหาชื่อนิสิต หรือรหัส..."
        />
        <StudentListTable students={students} />
      </div>
    </div>
  );
}
