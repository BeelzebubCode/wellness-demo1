// features/dashboard/rector/components/RectorDashboard.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useUniversityStats } from "../hooks/useUniversityStats";
import { LoadingSpinner } from "@/components/ui";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

// Helper for loading skeletons
const ChartSkeleton = ({ height = "h-[300px]" }: { height?: string }) => (
  <div className={`${height} w-full bg-slate-100/50 animate-pulse rounded-xl flex items-center justify-center`}>
    <LoadingSpinner size="sm" className="opacity-50" />
  </div>
);

// Core Strategic Components - Dynamic Imports
const YoYRiskTrendChart = dynamic(() => import("./strategic/YoYRiskTrendChart").then(mod => mod.YoYRiskTrendChart), {
  loading: () => <ChartSkeleton height="h-[350px]" />, ssr: false
});
const SystemLoadOverview = dynamic(() => import("./strategic/SystemLoadOverview").then(mod => mod.SystemLoadOverview), {
  loading: () => <ChartSkeleton height="h-[280px]" />, ssr: false
});
const WorkforceAnalysis = dynamic(() => import("./strategic/WorkforceAnalysis").then(mod => mod.WorkforceAnalysis), {
  loading: () => <ChartSkeleton height="h-[280px]" />, ssr: false
});
const ExecutiveImpactSummary = dynamic(() => import("./strategic/ExecutiveImpactSummary").then(mod => mod.ExecutiveImpactSummary), {
  loading: () => <ChartSkeleton height="h-full" />, ssr: false
});

// New Expanded Components - Dynamic Imports
const DemographicRiskChart = dynamic(() => import("./strategic/DemographicRiskChart").then(mod => mod.DemographicRiskChart), {
  loading: () => <ChartSkeleton height="h-[350px]" />, ssr: false
});
const IssueFrequencyChart = dynamic(() => import("./strategic/IssueFrequencyChart").then(mod => mod.IssueFrequencyChart), {
  loading: () => <ChartSkeleton height="h-[350px]" />, ssr: false
});
const AppointmentFunnelChart = dynamic(() => import("./strategic/AppointmentFunnelChart").then(mod => mod.AppointmentFunnelChart), {
  loading: () => <ChartSkeleton height="h-[280px]" />, ssr: false
});
const FacultyComparisonTable = dynamic(() => import("./strategic/FacultyComparisonTable").then(mod => mod.FacultyComparisonTable), {
  loading: () => <ChartSkeleton height="h-[400px]" />, ssr: false
});
const FacultyRiskSpectrumChart = dynamic(() => import("./strategic/FacultyRiskSpectrumChart").then(mod => mod.FacultyRiskSpectrumChart), {
  loading: () => <ChartSkeleton height="h-[600px]" />, ssr: false
});
const FacultyRiskBreakdownChart = dynamic(() => import("./strategic/FacultyRiskBreakdownChart").then(mod => mod.FacultyRiskBreakdownChart), {
  loading: () => <ChartSkeleton height="h-[600px]" />, ssr: false
});
const FacultyHealthVerticalBarChart = dynamic(() => import("./strategic/FacultyHealthVerticalBarChart").then(mod => mod.FacultyHealthVerticalBarChart), {
  loading: () => <ChartSkeleton height="h-[450px]" />, ssr: false
});

// Visual Maps - Dynamic Imports
const RectorFacultyHealthMap = dynamic(() => import("./RectorFacultyHealthMap").then(mod => mod.RectorFacultyHealthMap), {
  loading: () => <ChartSkeleton height="h-[450px]" />, ssr: false
});
const RectorWellbeingGauge = dynamic(() => import("./RectorWellbeingGauge").then(mod => mod.RectorWellbeingGauge), {
  loading: () => <ChartSkeleton height="h-[340px]" />, ssr: false
});
// Keep smaller components static or dynamic based on size
const RectorStatsCards = dynamic(() => import("./RectorStatsCards").then(mod => mod.RectorStatsCards), {
  loading: () => <ChartSkeleton height="h-[200px]" />, ssr: false
});
// RectorStrategicInsights might be text heavy, but safe to dynamic
const RectorStrategicInsights = dynamic(() => import("./RectorStrategicInsights").then(mod => mod.RectorStrategicInsights), {
  ssr: false
});

export function RectorDashboard() {
  // Date Range State (Default: This Month)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  });

  const { stats, isLoading, error } = useUniversityStats(dateRange);

  // Use wellbeing score if available, else fallback
  const wellbeingScore = stats?.wellbeing?.overallScore || 72;

  return (
    <div className="p-6 lg:p-10 min-h-screen font-sans bg-[#F8FAFC]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-slate-200 pb-6 gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-none mb-3">
            ศูนย์บัญชาการด้านสุขภาวะมหาวิทยาลัย
          </h1>
          <p className="text-sm text-slate-500 font-bold tracking-wide">
            แดชบอร์ดการกำกับดูแลและข้อมูลเชิงกลยุทธ์แบบเรียลไทม์
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right hidden md:block mr-1">
            <p className="text-xs font-bold text-slate-400">อัปเดตล่าสุด</p>
            <p className="text-sm font-bold text-slate-700">Today, {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          {/* Date Picker */}
          <div className="bg-white rounded-xl shadow-sm">
            <DateRangePicker
              startDate={dateRange.from}
              endDate={dateRange.to}
              onChange={(range) => setDateRange({ from: range.from, to: range.to })}
            />
          </div>

          <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
            อัพเดตข้อมูล
          </button>
        </div>
      </div>

      <div className="space-y-12">

        {/* =================================================================================
            SECTION 1: THE PULSE (EXECUTIVE SUMMARY)
            "สุขภาวะของนิสิตโดยรวมเป็นอย่างไร?" -> เรื่องที่สำคัญที่สุดต้องมาก่อน
           ================================================================================= */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-indigo-600">01</span> The Pulse
            </h2>
            <p className="text-slate-500 font-medium">ภาพรวมสุขภาวะและคุณภาพการบริการ (Overall Wellbeing & Service Quality)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* 1.1 HERO METRIC: Wellbeing Gauge (Centerpiece) */}
            <div className="md:col-span-4 min-h-[340px]">
              <RectorWellbeingGauge score={wellbeingScore} />
            </div>

            {/* 1.2 KEY STATS & SATISFACTION (Supporting Metrics) */}
            <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-full">
                <ExecutiveImpactSummary />
              </div>
              <div className="h-full">
                <RectorStatsCards stats={stats} />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================================
            SECTION 2: RISK LANDSCAPE (GEOGRAPHIC & CRITICAL)
            "จุดไหนคือจุดเสี่ยง? ใครน่าเป็นห่วง?" -> มองภาพกว้างแล้วเจาะจุดเสี่ยง
           ================================================================================= */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-rose-500">02</span> Risk Landscape
            </h2>
            <p className="text-slate-500 font-medium">แผนที่ความเสี่ยงและคณะที่ต้องเฝ้าระวัง (Critical Areas)</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 2.1 Visual Map (Bubble Chart) */}
            <div className="lg:col-span-8 min-h-[450px]">
              <RectorFacultyHealthMap data={stats?.healthMap || []} loading={isLoading} />
            </div>

            {/* 2.2 Top Risky Faculties (Focus List) */}
            <div className="lg:col-span-4 min-h-[450px]">
              <FacultyHealthVerticalBarChart data={stats?.healthMap} />
            </div>
          </div>
        </section>

        {/* =================================================================================
            SECTION 3: DEEP DIVE ANALYSIS (FACULTY SPECTRUM)
            "รายละเอียดเชิงลึกเป็นอย่างไร?" -> เจาะลึกข้อมูลรายณะ
           ================================================================================= */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-violet-600">03</span> Faculty Deep Dive
            </h2>
            <p className="text-slate-500 font-medium">วิเคราะห์เจาะลึกความเสี่ยงทุกคณะ (Complete Spectrum Analysis)</p>
          </div>

          <div className="space-y-8">
            {/* 3.1 & 3.2 Stacked Layout for Full Readability */}
            <div className="w-full min-h-[600px]">
              <FacultyRiskSpectrumChart data={stats?.healthMap} />
            </div>
            <div className="w-full min-h-[600px]">
              <FacultyRiskBreakdownChart data={stats?.healthMap} />
            </div>
          </div>
        </section>

        {/* =================================================================================
            SECTION 4: OPERATIONAL CAPABILITY
            "ระบบเรารับมือไหวไหม?" -> ดูทรัพยากรและการจัดการ
           ================================================================================= */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-emerald-600">04</span> System Operations
            </h2>
            <p className="text-slate-500 font-medium">ประสิทธิภาพระบบและการทำงานของบุคลากร (Operational Efficiency)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="min-h-[280px]"><SystemLoadOverview /></div>
            <div className="min-h-[280px]"><WorkforceAnalysis /></div>
            <div className="min-h-[280px]"><AppointmentFunnelChart /></div>
          </div>
        </section>

        {/* =================================================================================
            SECTION 5: STRATEGIC TRENDS (LONG TERM)
            "แนวโน้มระยะยาวเป็นอย่างไร?" -> ข้อมูลเพื่อการวางแผนอนาคต
           ================================================================================= */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-amber-500">05</span> Strategic Trends
            </h2>
            <p className="text-slate-500 font-medium">แนวโน้มระยะยาวและประเด็นสำคัญ (Long-term Strategy)</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="min-h-[350px]"><YoYRiskTrendChart /></div>
            <div className="min-h-[350px]"><IssueFrequencyChart /></div>
          </div>
          <div className="mt-6 min-h-[350px]">
            <DemographicRiskChart />
          </div>
        </section>

        {/* =================================================================================
            SECTION 6: RAW DATA REFERENCE
            "ขอดูข้อมูลดิบหน่อย" -> ตารางข้อมูลละเอียดท้ายสุด
           ================================================================================= */}
        <section>
          <div className="mb-6 flex items-center gap-2 text-slate-400">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs font-bold uppercase tracking-widest">Reference Data</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
          <div className="min-h-[400px]">
            <FacultyComparisonTable />
          </div>
        </section>

      </div>

      <div className="mt-20 text-center border-t border-slate-100 pt-10 pb-6">
        <span className="text-slate-300 font-bold text-xs uppercase tracking-widest">CONFIDENTIAL • EXECUTIVE USE ONLY</span>
      </div>
    </div>
  );
}
