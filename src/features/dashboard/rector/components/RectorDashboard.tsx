"use client";

import { useState } from "react";
import { useUniversityStats } from "../hooks/useUniversityStats";
import { RectorStatsCards } from "./RectorStatsCards";
import { RectorAnalyticsCharts } from "./RectorAnalyticsCharts";
import { RectorStudentList } from "./RectorStudentList";
import { RectorRiskChart } from "./RectorRiskChart";
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

export function RectorDashboard() {
  const { stats, analytics, facultyBreakdown, riskTrends, isLoading, error } = useUniversityStats();
  const [filters, setFilters] = useState<any>({});

  if (isLoading || !stats) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center bg-red-50 rounded-xl">
        <p className="text-red-600">เกิดข้อผิดพลาด: {error}</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-8 p-6 rounded-2xl min-h-screen"
      style={{ backgroundColor: `rgba(var(--primary), 0.03)` }}
    >
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tighter">
          แผงควบคุมอธิการบดี
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
          ภาพรวมการดูแลนิสิตทั้งมหาวิทยาลัย {stats.universityName}
        </p>
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <RectorStatsCards stats={stats} />
      </div>

      {/* ===== Analytics Section ===== */}
      {analytics && (
        <div
          className="rounded-[2.5rem] p-8"
          style={{
            background: `linear-gradient(145deg, rgb(var(--bg-grad-1)) 0%, rgb(var(--bg-grad-2)) 100%)`
          }}
        >
          <div className="mb-6 flex flex-col gap-1">
            <h2
              className="text-2xl font-black tracking-tighter"
              style={{ color: `rgb(var(--primary-600))` }}
            >
              ภาพรวมเชิงวิเคราะห์ระดับมหาวิทยาลัย
            </h2>
            <p className="text-sm font-bold opacity-70 tracking-tight" style={{ color: `rgb(var(--primary))` }}>
              แนวโน้มและสถิติด้านสุขภาวะของนิสิตทุกคณะในมหาวิทยาลัย
            </p>
          </div>
          <RectorAnalyticsCharts analytics={analytics} />
        </div>
      )}

      {/* ===== Main Content ===== */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
        {/* --- Faculty Overview Table --- */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-[rgb(var(--primary))] pl-4 tracking-tight">
            ภาพรวมนิสิตแยกตามคณะ
          </h2>
          <p className="text-sm text-slate-400 ml-5 font-medium tracking-tight">
            สรุปจำนวนนิสิตและระดับความเสี่ยงในแต่ละคณะ
          </p>
        </div>

        <FilterBar
          defs={FILTER_DEFS}
          value={filters}
          onChange={setFilters}
          searchKey="search"
          searchPlaceholder="ค้นหาคณะ หรือรหัส..."
        />

        <RectorStudentList data={facultyBreakdown || []} />
      </div>
    </div>
  );
}
