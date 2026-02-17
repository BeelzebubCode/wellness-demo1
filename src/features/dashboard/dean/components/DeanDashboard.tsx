import { useState } from "react";
import { useFacultyStats } from "../hooks/useFacultyStats";
import { LoadingSpinner } from "@/components/ui";
import { DeanOverviewCards } from "./sections/DeanOverviewCards";
import { DepartmentBreakdownTable } from "./sections/DepartmentBreakdownTable";
import dynamic from "next/dynamic";

const DeanAnalytics = dynamic(() => import("./sections/DeanAnalytics").then(mod => mod.DeanAnalytics), {
    loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-xl" />,
    ssr: false
});

import { ExecutiveSummarySection } from "./sections/ExecutiveSummarySection";
import { FacultyDateRangePicker } from "./FacultyDateRangePicker";

interface DeanDashboardProps {
    facultyCode?: string;
}

export function DeanDashboard({ facultyCode }: DeanDashboardProps) {
    // Default to Last 30 Days (Today - 30 days)
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(() => {
        const to = new Date();
        to.setHours(23, 59, 59, 999);

        const from = new Date(to);
        from.setDate(from.getDate() - 30); // Go back 30 days
        from.setHours(0, 0, 0, 0);

        return { from, to };
    });

    const {
        stats,
        isLoading,
    } = useFacultyStats(facultyCode, dateRange as { from: Date; to: Date } | undefined);

    if (isLoading || !stats) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-slate-50/50 rounded-2xl">
                <div className="flex flex-col items-center gap-4">
                    <LoadingSpinner size="lg" />
                    <p className="text-slate-400 text-sm animate-pulse">กำลังประมวลผลข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <div className="space-y-8">
                {/* Faculty Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div />
                    <div className="flex flex-col items-end gap-2">
                        <FacultyDateRangePicker
                            startDate={dateRange?.from}
                            endDate={dateRange?.to}
                            onChange={(range: { from?: Date; to?: Date }) => {
                                if (!range.from && !range.to) {
                                    setDateRange(undefined);
                                } else {
                                    setDateRange(range);
                                }
                            }}
                        />

                        <div className="text-right">
                            {stats.academicYear && (!dateRange || (!dateRange.from && !dateRange.to)) ? (
                                <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg mb-1">
                                    ปีการศึกษา {stats.academicYear}
                                </span>
                            ) : (dateRange?.from || dateRange?.to) && (
                                <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg mb-1">
                                    {(dateRange.from && dateRange.to) 
                                        ? `${dateRange.from.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${dateRange.to.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                        : dateRange.from 
                                            ? `ตั้งแต่ ${dateRange.from.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                            : `ถึง ${dateRange.to?.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                    }
                                </span>
                            )}
                            <p className="text-xs text-slate-400">
                                อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 1. KEY PERFORMANCE INDICATORS */}
                <section>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800">ภาพรวม</h3>
                        <p className="text-sm text-slate-500">ดัชนีชี้วัดสำคัญของคณะ</p>
                    </div>
                    <DeanOverviewCards stats={stats} />
                </section>

                {/* 2. ANALYTICS & INSIGHTS */}
                <section>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800">การวิเคราะห์</h3>
                        <p className="text-sm text-slate-500">แนวโน้ม ความเสี่ยง และประเภทปัญหา</p>
                    </div>
                    <DeanAnalytics stats={stats} />
                </section>

                {/* 3. DEPARTMENT FOCUS */}
                <section>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800">ภาพรวมภาควิชา</h3>
                        <p className="text-sm text-slate-500">เปรียบเทียบสถิติระหว่างภาควิชาในคณะ</p>
                    </div>
                    <DepartmentBreakdownTable stats={stats.departmentStats} />
                </section>

                {/* 5. EXECUTIVE SUMMARY */}
                <section>
                    <div className="mb-4">
                        <ExecutiveSummarySection stats={stats} />
                    </div>
                </section>

                {/* FOOTER */}
                <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                        <span>ระบบสุขภาวะนิสิต — Mental Health Intelligence</span>
                        <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span>ข้อมูล ณ {new Date().toLocaleDateString('th-TH')}</span>
                    </div>
                    <span className="px-2 py-1 bg-slate-100 rounded text-slate-500 font-mono text-[10px] uppercase tracking-widest">เอกสารลับ</span>
                </div>
            </div>
        </div>
    );
}
