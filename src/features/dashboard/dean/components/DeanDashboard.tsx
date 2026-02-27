"use client";

import { useAnalytics } from "../../widgets/hooks/useAnalytics";
import { DashboardFilterBar } from "../../widgets/filters/DashboardFilterBar";
import dynamic from "next/dynamic";

const ProblemLandscapeChart = dynamic(
    () => import("../../widgets/charts/ProblemLandscapeChart").then((m) => ({ default: m.ProblemLandscapeChart })),
    { loading: () => <div className="h-[600px] bg-slate-50 animate-pulse rounded-3xl" />, ssr: false }
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
                    <DashboardFilterBar role="dean" params={params} onChange={setParams} />
                </section>

                {/* Problem Landscape */}
                <section>
                    <ProblemLandscapeChart data={data?.problemCategories ?? []} loading={loading} />
                </section>

                {/* [CLEARED] Space for new designs */}
                <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-100/30 p-12 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-2xl">
                        💡
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">พื้นที่รวบรวมข้อมูลใหม่</h3>
                    <p className="text-slate-500 text-sm max-w-sm mt-2">
                        ขณะนี้ได้นำการแสดงผลเดิมออกแล้ว เพื่อเตรียมความพร้อมสำหรับหน้า Dashboard รูปแบบใหม่ที่มีประสิทธิภาพกว่าเดิม
                    </p>
                </div>

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

