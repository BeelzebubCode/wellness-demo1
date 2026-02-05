// features/dashboard/advisor/components/AdvisorDashboard.tsx
"use client";

import { useAdvisorStats } from "../hooks/useAdvisorStats";
import { AdvisorStatsCards } from "./AdvisorStatsCards";
import { StudentListTable } from "./StudentListTable";
import { AdvisorRiskChart } from "./AdvisorRiskChart";
import { LoadingSpinner } from "@/components/ui";

import { FilterBar } from "@/components/filters/FilterBar";
import { FilterDef } from "@/components/filters/types";

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

export function AdvisorDashboard() {
  const { stats, students, riskTrends, isLoading, filters, setFilters } = useAdvisorStats();

  if (isLoading || !stats) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">แผงควบคุมอาจารย์ที่ปรึกษา</h1>
        <p className="text-gray-500">ภาพรวมการดูแลนิสิตในที่ปรึกษาของคุณ</p>
      </div>

      <AdvisorStatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            <FilterBar 
                defs={FILTER_DEFS}
                value={filters}
                onChange={setFilters}
                searchKey="search"
                searchPlaceholder="ค้นหาชื่อนิสิต หรือรหัส..."
            />
            <StudentListTable students={students} />
        </div>
        <div className="lg:col-span-1">
            <AdvisorRiskChart data={riskTrends} />
        </div>
      </div>
    </div>
  );
}
