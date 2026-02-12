"use client";

import { useAdvisorStats } from "../hooks/useAdvisorStats";
import { AdvisorStatsCards } from "./AdvisorStatsCards";
import { StudentListTable } from "./StudentListTable";
import dynamic from "next/dynamic";

const AdvisorRiskChart = dynamic(() => import("./AdvisorRiskChart").then(mod => mod.AdvisorRiskChart), {
  loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-xl" />,
  ssr: false
});
const AdvisorAnalyticsCharts = dynamic(() => import("./AdvisorAnalyticsCharts").then(mod => mod.AdvisorAnalyticsCharts), {
  loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-xl" />,
  ssr: false
});
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
    placeholder: "ทั้งหมด",
  },
];

export function AdvisorDashboard() {
  const {
    stats,
    students,
    riskTrends,
    analytics,
    isLoading,
    filters,
    setFilters,
  } = useAdvisorStats();

  if (isLoading || !stats) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50 p-6 rounded-2xl">
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">
          แผงควบคุมอาจารย์ที่ปรึกษา
        </h1>
        <p className="text-slate-500">
          ภาพรวมการดูแลนิสิตในที่ปรึกษาของคุณ
        </p>
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <AdvisorStatsCards stats={stats} />
      </div>

      {/* ===== Analytics Section ===== */}
      {analytics && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-indigo-900">
              ภาพรวมเชิงวิเคราะห์
            </h2>
            <p className="text-sm text-indigo-600">
              แนวโน้มและสถิติด้านสุขภาวะของนิสิต
            </p>
          </div>
          <AdvisorAnalyticsCharts analytics={analytics} />
        </div>
      )}

      {/* ===== Main Content ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Student List --- */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              รายชื่อนิสิตในที่ปรึกษา
            </h2>
            <p className="text-sm text-slate-500">
              ค้นหาและคัดกรองนิสิตตามระดับความเสี่ยง
            </p>
          </div>

          <FilterBar
            defs={FILTER_DEFS}
            value={filters}
            onChange={setFilters}
            searchKey="search"
            searchPlaceholder="ค้นหาชื่อนิสิต หรือรหัส..."
          />

          <StudentListTable students={students} />
        </div>

        {/* --- Risk Trend --- */}
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-rose-900">
              แนวโน้มความเสี่ยง
            </h2>
            <p className="text-sm text-rose-600">
              การเปลี่ยนแปลงระดับความเสี่ยงของนิสิต
            </p>
          </div>

          <AdvisorRiskChart data={riskTrends} />
        </div>
      </div>
    </div>
  );
}
