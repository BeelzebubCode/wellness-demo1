import { useState } from "react";
import { useFacultyStats } from "../hooks/useFacultyStats";
import { LoadingSpinner } from "@/components/ui";
import { DeanOverviewCards } from "./sections/DeanOverviewCards";
import { DeanAnalytics } from "./sections/DeanAnalytics";
import { DepartmentBreakdownTable } from "./sections/DepartmentBreakdownTable";
import { TherapistWorkloadSection } from "./sections/TherapistWorkloadSection";
import { ExecutiveSummarySection } from "./sections/ExecutiveSummarySection";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

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
        <div className="space-y-8">
            {/* Faculty Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{stats.facultyName}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{stats.universityName} · {stats.facultyCode}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <DateRangePicker
                        startDate={dateRange?.from}
                        endDate={dateRange?.to}
                        onChange={(range) => setDateRange(range)}
                    />

                    <div className="text-right">
                        {stats.academicYear && !dateRange && (
                            <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg mb-1">
                                ปีการศึกษา {stats.academicYear}
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

            {/* 4. CONSULTANT WORKLOAD */}
            {stats.consultantStats && stats.consultantStats.length > 0 && (
                <section>
                    <TherapistWorkloadSection
                        consultantStats={stats.consultantStats}
                        academicYear={stats.academicYear}
                    />
                </section>
            )}

            {/* 5. EXECUTIVE SUMMARY */}
            <section>
                <ExecutiveSummarySection stats={stats} />
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
    );
}
