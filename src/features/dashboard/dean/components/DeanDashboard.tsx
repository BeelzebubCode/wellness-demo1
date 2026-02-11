"use client";

import { useFacultyStats } from "../hooks/useFacultyStats";
import { DeanStatsCards } from "./DeanStatsCards";
import { DeanAnalyticsCharts } from "./DeanAnalyticsCharts";
import { DeanStudentList } from "./DeanStudentList";
import { DeanRiskChart } from "./DeanRiskChart";
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

interface DeanDashboardProps {
    facultyCode?: string;
}

export function DeanDashboard({ facultyCode }: DeanDashboardProps) {
    const {
        stats,
        analytics,
        students,
        riskTrends,
        isLoading,
        filters,
        setFilters,
    } = useFacultyStats(facultyCode);

    if (isLoading || !stats) {
        return (
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-8 bg-slate-50 p-6 rounded-2xl">
            {/* ===== Header ===== */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-900">
                    แผงควบคุมคณบดี
                </h1>
                <p className="text-slate-500">
                    ภาพรวมการดูแลนิสิตในคณะ {stats.facultyName}
                </p>
            </div>

            {/* ===== Stats Cards ===== */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
                <DeanStatsCards stats={stats} />
            </div>

            {/* ===== Analytics Section ===== */}
            {analytics && (
                <div className="bg-gradient-to-br from-[rgb(var(--bg-grad-1))] to-[rgb(var(--bg-grad-2))] rounded-2xl p-4 shadow-sm">
                    <div className="mb-3">
                        <h2 className="text-lg font-semibold text-[rgb(var(--primary-600))]">
                            ภาพรวมเชิงวิเคราะห์
                        </h2>
                        <p className="text-sm text-[rgb(var(--primary))]">
                            แนวโน้มและสถิติด้านสุขภาวะของนิสิตในคณะ
                        </p>
                    </div>
                    <DeanAnalyticsCharts analytics={analytics} />
                </div>
            )}

            {/* ===== Main Content: Student List + Risk Trend ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- Student List --- */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-sm space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            รายชื่อนิสิตในคณะ
                        </h2>
                        <p className="text-sm text-slate-500">
                            ค้นหาและคัดกรองนิสิตตามระดับความเสี่ยง
                        </p>
                    </div>

                    <FilterBar
                        defs={FILTER_DEFS}
                        value={filters}
                        onChange={setFilters}
                        searchKey="search"
                        searchPlaceholder="ค้นหาชื่อนิสิต หรือรหัส..."
                    />

                    <DeanStudentList students={students || []} />
                </div>

                {/* --- Risk Trend --- */}
                <div className="bg-gradient-to-br from-[rgb(var(--bg-grad-2))] to-[rgb(var(--bg-grad-1))] rounded-2xl p-4 shadow-sm">
                    <div className="mb-3">
                        <h2 className="text-lg font-semibold text-[rgb(var(--primary-600))]">
                            แนวโน้มความเสี่ยง
                        </h2>
                        <p className="text-sm text-[rgb(var(--primary))]">
                            การเปลี่ยนแปลงระดับความเสี่ยงของนิสิต
                        </p>
                    </div>

                    <DeanRiskChart data={riskTrends || []} />
                </div>
            </div>
        </div>
    );
}
