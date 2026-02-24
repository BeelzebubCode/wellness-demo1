"use client";

import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { useAnalytics } from "../../shared/useAnalytics";
import { AnalyticsFilterBar } from "../../shared/AnalyticsFilterBar";

// Strategic Components
const StrategicKPICards = dynamic(
  () => import("./StrategicKPICards").then((m) => ({ default: m.StrategicKPICards })),
  { loading: () => <div className="h-32 bg-slate-50 animate-pulse rounded-3xl" />, ssr: false }
);

const FacultyVolumeChart = dynamic(
  () => import("./FacultyVolumeChart").then((m) => ({ default: m.FacultyVolumeChart })),
  { loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-3xl" />, ssr: false }
);

const StrategicRiskHeatmap = dynamic(
  () => import("./StrategicRiskHeatmap").then((m) => ({ default: m.StrategicRiskHeatmap })),
  { loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-3xl" />, ssr: false }
);

const ProblemDNAChart = dynamic(
  () => import("./ProblemDNAChart").then((m) => ({ default: m.ProblemDNAChart })),
  { loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-3xl" />, ssr: false }
);

const ComparativeTrendChart = dynamic(
  () => import("./ComparativeTrendChart").then((m) => ({ default: m.ComparativeTrendChart })),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-3xl" />, ssr: false }
);

const ProblemLandscapeChart = dynamic(
  () => import("../../shared/ProblemLandscapeChart").then((m) => ({ default: m.ProblemLandscapeChart })),
  { loading: () => <div className="h-[600px] bg-slate-50 animate-pulse rounded-3xl" />, ssr: false }
);

export function RectorDashboard() {
  const { data, loading, params, setParams } = useAnalytics();

  const isDrillDown = !!params.faculty_id;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-8 bg-indigo-600 rounded-full" />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              ศูนย์บัญชาการวิสัยทัศน์สุขภาวะ
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold uppercase tracking-wider">Executive Suite</span>
            การกำกับดูแลเชิงกลยุทธ์และนโยบายระดับมหาวิทยาลัย
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 border border-slate-100 rounded-2xl shadow-sm">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">System Status</p>
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 justify-end">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Analytics
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <section className="relative z-40 bg-white/50 backdrop-blur-sm p-1 rounded-[2.5rem] border border-white/50">
        <AnalyticsFilterBar params={params} onChange={setParams} />
      </section>

      {/* Drilldown breadcrumb */}
      {isDrillDown && (
        <button
          onClick={() => setParams({ faculty_id: undefined, department_id: undefined })}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 hover:shadow-md transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับสู่ภาพรวมระดับมหาวิทยาลัย
        </button>
      )}

      {/* 1. STRATEGIC KPI CARDS */}
      <section>
        <StrategicKPICards
          current={data?.summary}
          previous={data?.previousSummary}
          loading={loading}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. DEMAND TREND */}
        <div className="lg:col-span-2">
          <ComparativeTrendChart data={data?.trend ?? []} loading={loading} />
        </div>

        {/* 3. PROBLEM DNA (Policy Focus) */}
        <div>
          <ProblemDNAChart data={data?.problemCategories ?? []} loading={loading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. SAFETY CLUSTERS (Risk Focus) */}
        <StrategicRiskHeatmap data={data?.loadIndex ?? []} loading={loading} />

        <FacultyVolumeChart
          data={data?.loadIndex ?? []}
          loading={loading}
          onBarClick={(item) => setParams({ faculty_id: item.groupId })}
        />
      </div>

      {/* 6. PROBLEM LANDSCAPE (Comprehensive Distribution) */}
      <section>
        <ProblemLandscapeChart data={data?.problemCategories ?? []} loading={loading} />
      </section>

      {/* FOOTER */}
      <div className="pt-12 pb-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            Confidential Policy data
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            Rector Access Only
          </span>
        </div>
        <p>© {new Date().getFullYear()} KU WELLNESS COMMAND CENTER • V2.0 STRATEGIC</p>
      </div>
    </div>
  );
}

