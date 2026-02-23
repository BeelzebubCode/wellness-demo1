"use client";

import React from "react";
import dynamic from "next/dynamic";
import { TrendingUp } from "lucide-react";

// Shared Analytics Components
import { useAnalytics } from "../../shared/useAnalytics";
import { AnalyticsFilterBar } from "../../shared/AnalyticsFilterBar";
import { SummaryKPICards } from "../../shared/SummaryKPICards";
import { CancellationSummary } from "../../shared/CancellationSummary";

const LoadIndexChart = dynamic(
    () => import("./MinistryLoadIndexChart").then((m) => ({ default: m.MinistryLoadIndexChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const ProblemCategoryChart = dynamic(
    () => import("../../shared/ProblemCategoryChart").then((m) => ({ default: m.ProblemCategoryChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const AttendanceChart = dynamic(
    () => import("../../shared/AttendanceChart").then((m) => ({ default: m.AttendanceChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const RiskDistributionChart = dynamic(
    () => import("./MinistryRiskDistributionChart").then((m) => ({ default: m.MinistryRiskDistributionChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const TrendChart = dynamic(
    () => import("./MinistryTrendChart").then((m) => ({ default: m.MinistryTrendChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);

export function MinistryNationalDashboard() {
    // 🌍 useAnalytics without any hardcoded university_code implies National Scope (tenant overrides skipped by Backend logic)
    // Default to all_time so national data across all periods is visible
    const { data, loading, params, setParams } = useAnalytics({ all_time: true });

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-3xl p-8 lg:p-10 shadow-xl border border-white/10">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-20 -mb-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-50 tracking-wide uppercase">Live Analytics Data</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                            แดชบอร์ดส่วนกลาง
                            <span className="block text-lg md:text-xl mt-1.5 font-medium text-slate-300">National Healthcare Analytics</span>
                        </h1>
                        <p className="text-slate-400 mt-3 max-w-2xl text-sm md:text-base leading-relaxed">
                            ระบบวิเคราะห์ข้อมูลและนโยบายด้านสุขภาพจิตนิสิตครอบคลุมเครือข่ายมหาวิทยาลัยทั่วประเทศแบบเรียลไทม์
                        </p>
                    </div>
                </div>
            </div>

            {/* 1. Filter Bar (National Mode Enabled) */}
            <section className="relative z-40">
                <AnalyticsFilterBar
                    params={params}
                    onChange={setParams}
                    showNationalFilters={true} // 🌟 Enables Region/Province/University dropdowns
                    hideFaculty={!params.university_id} // Hide faculty until a specific university is selected
                />
            </section>

            {/* 2. Top-level KPIs */}
            <section>
                <SummaryKPICards data={data?.summary ?? null} loading={loading} />
            </section>

            {/* 3. Primary Charts Row */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LoadIndexChart
                    data={data?.loadIndex ?? []}
                    loading={loading}
                    title="Load Index / ภาระงาน"
                    subtitle="ภาพรวมการขอรับคำปรึกษาเทียบกับความเสี่ยง"
                />
                <RiskDistributionChart
                    data={data?.riskDistribution ?? null}
                    loading={loading}
                />
            </section>

            {/* 4. Problem Category Breakdown */}
            <section>
                <ProblemCategoryChart
                    data={data?.problemCategories ?? []}
                    loading={loading}
                />
            </section>

            {/* 5. Detailed Breakdown Row */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AttendanceChart
                    data={data?.attendanceByGroup ?? []}
                    loading={loading}
                />
                <CancellationSummary
                    data={data?.cancellationByGroup ?? []}
                    loading={loading}
                />
            </section>

            {/* 6. Time Series Trend */}
            <section>
                <TrendChart
                    data={data?.trend ?? []}
                    loading={loading}
                />
            </section>
        </div>
    );
}
