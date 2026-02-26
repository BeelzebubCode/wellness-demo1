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

const TherapistResourceChart = dynamic(
  () => import("./TherapistResourceChart").then((m) => ({ default: m.TherapistResourceChart })),
  { loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-3xl" />, ssr: false }
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

      {/* 1. EXECUTIVE PULSE: Top-level KPIs */}
      <section className="animate-in slide-in-from-bottom duration-500">
        <StrategicKPICards
          current={data?.summary}
          previous={data?.previousSummary}
          loading={loading}
        />
      </section>

      {/* 2. STRATEGIC DYNAMICS: Demand Trend & Problem DNA */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Strategic Demand Dynamics</h2>
            <p className="text-xs text-slate-500 font-medium">วิเคราะห์แนวโน้มความต้องการและสัดส่วนประเภทปัญหาเชิงนโยบาย</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ComparativeTrendChart
              data={data?.trend ?? []}
              resolution={data?.trendResolution}
              loading={loading}
            />
          </div>
          <div>
            <ProblemDNAChart data={data?.problemCategories ?? []} loading={loading} />
          </div>
        </div>
      </section>

      {/* 3. RESOURCE & CAPACITY: Resource Origins & Faculty Volume */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Resource Capacity & Sustainability</h2>
            <p className="text-xs text-slate-500 font-medium">การบริหารจัดการบุคลากรและศักยภาพการรองรับนิสิตแยกตามคณะ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <TherapistResourceChart data={data?.therapistResource} />
          </div>
          <div className="lg:col-span-3">
            <FacultyVolumeChart
              data={data?.loadIndex ?? []}
              loading={loading}
              onBarClick={(item) => setParams({ faculty_id: item.groupId })}
            />
          </div>
        </div>
      </section>

      {/* 4. RISK & LANDSCAPE: Deep-Dive Analysis */}
      <section className="space-y-6 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-rose-50 rounded-xl">
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Institutional Risk & Holistic Landscape</h2>
            <p className="text-xs text-slate-500 font-medium">การเฝ้าระวังกลุ่มเสี่ยงและการกระจายตัวของปัญหาในระดับมหภาค</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <StrategicRiskHeatmap data={data?.loadIndex ?? []} loading={loading} />
          <ProblemLandscapeChart data={data?.problemCategories ?? []} loading={loading} />
        </div>
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

