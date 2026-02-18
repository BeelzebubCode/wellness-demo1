"use client";

import { useState, useCallback } from "react";
import { useAdvisorStats } from "../hooks/useAdvisorStats";
import { AdvisorStatsCards } from "./AdvisorStatsCards";
import { StudentListTable } from "./StudentListTable";
import { AdvisorAdvancedFilter } from "./AdvisorAdvancedFilter";
import { AdvisorDashboardFilters } from "../types";
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

  const [activeQuickFilter, setActiveQuickFilter] = useState("all");

  const handleQuickFilterChange = useCallback((id: string) => {
    setActiveQuickFilter(id);
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (id === "all") {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      setFilters(prev => ({ search: prev.search, startDate: from, endDate: now }));
    } else if (id === "high-risk") {
      setFilters(prev => ({
        ...prev,
        riskLevel: "HIGH",
      }));
    } else if (id === "new-cases") {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      setFilters(prev => ({ search: prev.search, startDate: from, endDate: now }));
    }
  }, [setFilters]);

  // Check if filters are active beyond defaults
  const hasActiveFilters = !!(filters.riskLevel || filters.problemCategoryId || filters.gender);

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

      {/* ===== Advanced Filter (Dean-style) ===== */}
      <AdvisorAdvancedFilter
        filters={filters}
        onFilterChange={setFilters}
        activeQuickFilter={activeQuickFilter}
        onQuickFilterChange={handleQuickFilterChange}
      />
      {hasActiveFilters && (
        <div className="flex justify-end -mt-4">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
            🔍 กำลังกรองข้อมูล
          </span>
        </div>
      )}

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
