"use client";

import { useState } from "react";
import { useUniversityStats } from "../hooks/useUniversityStats";
import { LoadingSpinner } from "@/components/ui";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

// Import New Modular Sections
import { RectorOverviewCards } from "./sections/RectorOverviewCards";
import { RectorAnalytics } from "./sections/RectorAnalytics";
import { FacultyBreakdownTable } from "./sections/FacultyBreakdownTable";
import { RectorExecutiveSummary } from "./sections/RectorExecutiveSummary";

export function RectorDashboard() {
  // Default to Last 30 Days (Today - 30 days)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(() => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);

    const from = new Date(to);
    from.setDate(from.getDate() - 30); // Go back 30 days
    from.setHours(0, 0, 0, 0);

    return { from, to };
  });

  const { stats, isLoading } = useUniversityStats(dateRange as { from: Date; to: Date } | undefined);

  if (isLoading || !stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50/50 rounded-2xl">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 text-sm animate-pulse">กำลังประมวลผลข้อมูลระดับมหาวิทยาลัย...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">ศูนย์บัญชาการด้านสุขภาวะมหาวิทยาลัย</h1>
            <p className="text-slate-500 text-sm mt-1">ข้อมูลเชิงลึกและการกำกับดูแลระดับมหาวิทยาลัย (Executive Command Center)</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <DateRangePicker
              startDate={dateRange?.from}
              endDate={dateRange?.to}
              onChange={(range: { from?: Date; to?: Date }) => setDateRange(range)}
            />
            <div className="text-right">
              <p className="text-xs text-slate-400">
                อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* 1. KEY PERFORMANCE INDICATORS */}
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">ภาพรวมมหาวิทยาลัย (University KPI)</h3>
          </div>
          <RectorOverviewCards stats={stats} />
        </section>

        {/* 2. ANALYTICS & INSIGHTS */}
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">การวิเคราะห์เชิงลึก (Deep Analytics)</h3>
          </div>
          <RectorAnalytics stats={stats} />
        </section>

        {/* 3. FACULTY FOCUS (Deep Dive) */}
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">เปรียบเทียบระหว่างคณะ (Faculty Breakdown)</h3>
          </div>
          <FacultyBreakdownTable stats={stats.facultyBreakdown} />
        </section>

        {/* 4. EXECUTIVE SUMMARY */}
        <section>
          <RectorExecutiveSummary stats={stats} />
        </section>

        {/* FOOTER */}
        <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>ระบบสุขภาวะนิสิต — Mental Health Intelligence</span>
            <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>ข้อมูล ณ {new Date().toLocaleDateString('th-TH')}</span>
          </div>
          <span className="px-2 py-1 bg-slate-100 rounded text-slate-500 font-mono text-[10px] uppercase tracking-widest">เอกสารลับ (ระดับอธิการบดี)</span>
        </div>
      </div>
    </div>
  );
}
