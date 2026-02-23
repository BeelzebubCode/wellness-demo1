"use client";

import dynamic from "next/dynamic";
import { useAnalytics } from "../../shared/useAnalytics";
import { AnalyticsFilterBar } from "../../shared/AnalyticsFilterBar";
import { SummaryKPICards } from "../../shared/SummaryKPICards";
import { CancellationSummary } from "../../shared/CancellationSummary";

const LoadIndexChart = dynamic(
    () => import("../../shared/LoadIndexChart").then((m) => ({ default: m.LoadIndexChart })),
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
    () => import("../../shared/RiskDistributionChart").then((m) => ({ default: m.RiskDistributionChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const TrendChart = dynamic(
    () => import("../../shared/TrendChart").then((m) => ({ default: m.TrendChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);

export function DeanDashboard({ facultyCode }: { facultyCode?: string } = {}) {
    const { data, loading, params, setParams } = useAnalytics(
        facultyCode ? { faculty_code: facultyCode } : undefined,
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            แผงควบคุมคณบดี
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            ข้อมูลเชิงลึกระดับคณะ — สาขาวิชา
                        </p>
                    </div>
                    <p className="text-xs text-slate-400">
                        อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>

                {/* Filter Bar — faculty hidden (pre-locked by API scope) */}
                <section className="relative z-40">
                    <AnalyticsFilterBar params={params} onChange={setParams} hideFaculty />
                </section>

                {/* 1. KEY PERFORMANCE INDICATORS */}
                <section>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800">ภาพรวม</h3>
                        <p className="text-sm text-slate-500">ดัชนีชี้วัดสำคัญของคณะ</p>
                    </div>
                    <SummaryKPICards data={data?.summary ?? null} loading={loading} />
                </section>

                {/* 2. ANALYTICS & INSIGHTS */}
                <section>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800">การวิเคราะห์</h3>
                        <p className="text-sm text-slate-500">แนวโน้ม ความเสี่ยง และประเภทปัญหา</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LoadIndexChart
                            data={data?.loadIndex ?? []}
                            loading={loading}
                            title="Load Index ตามสาขา"
                            subtitle="สาขาไหนมีภาระมากสุด"
                        />
                        <RiskDistributionChart data={data?.riskDistribution ?? null} loading={loading} />
                    </div>
                </section>

                {/* 3. PROBLEM CATEGORIES */}
                <section>
                    <ProblemCategoryChart data={data?.problemCategories ?? []} loading={loading} />
                </section>

                {/* 4. DEPARTMENT BREAKDOWN */}
                <section>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800">ภาพรวมภาควิชา</h3>
                        <p className="text-sm text-slate-500">เปรียบเทียบสถิติระหว่างภาควิชาในคณะ</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AttendanceChart data={data?.attendanceByGroup ?? []} loading={loading} />
                        <CancellationSummary data={data?.cancellationByGroup ?? []} loading={loading} />
                    </div>
                </section>

                {/* 5. TREND */}
                <section>
                    <TrendChart data={data?.trend ?? []} loading={loading} />
                </section>

                {/* FOOTER */}
                <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                        <span>ระบบสุขภาวะนิสิต — Mental Health Intelligence</span>
                        <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full" />
                        <span>ข้อมูล ณ {new Date().toLocaleDateString("th-TH")}</span>
                    </div>
                    <span className="px-2 py-1 bg-slate-100 rounded text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                        เอกสารลับ
                    </span>
                </div>
            </div>
        </div>
    );
}
