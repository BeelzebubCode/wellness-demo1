"use client";

import React, { useEffect, useState } from "react";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterDef } from "@/components/filters/types";
import { FacultyDateRangePicker } from "@/features/dashboard/dean/components/FacultyDateRangePicker";
import {
    Users,
    Filter,
    AlertTriangle,
    Zap
} from "lucide-react";
import { AdvisorDashboardFilters } from "../types";

interface FilterOptions {
    problemCategories: { problem_category_id: number; problem_category_name_th: string; problem_category_name_en: string | null }[];
}

interface AdvisorAdvancedFilterProps {
    filters: AdvisorDashboardFilters;
    onFilterChange: (filters: AdvisorDashboardFilters) => void;
    activeQuickFilter: string;
    onQuickFilterChange: (id: string) => void;
}

const RISK_OPTIONS = [
    { label: "ทุกระดับ", value: "ALL" },
    { label: "🔴 เสี่ยงสูง (High)", value: "HIGH" },
    { label: "🟠 ปานกลาง (Medium)", value: "MEDIUM" },
    { label: "🟢 เสี่ยงต่ำ (Low)", value: "LOW" },
    { label: "⚪ ปกติ (Normal)", value: "NORMAL" },
];

const GENDER_OPTIONS = [
    { label: "ทุกเพศ", value: "ALL" },
    { label: "ชาย", value: "MALE" },
    { label: "หญิง", value: "FEMALE" },
    { label: "อื่นๆ", value: "OTHER" },
];

function buildFilterDefs(problemOptions: { label: string; value: string }[]): FilterDef<any>[] {
    return [
        { key: "riskLevel", label: "ระดับความเสี่ยง (Risk)", type: "select", options: RISK_OPTIONS },
        { key: "problemCategoryId", label: "ประเภทปัญหา (Problem)", type: "select", options: problemOptions },
        { key: "gender", label: "เพศ (Gender)", type: "select", options: GENDER_OPTIONS },
    ];
}

export function AdvisorAdvancedFilter({
    filters,
    onFilterChange,
    activeQuickFilter,
    onQuickFilterChange,
}: AdvisorAdvancedFilterProps) {
    const [problemCategories, setProblemCategories] = useState<{ label: string; value: string }[]>([
        { label: "ทุกประเภทปัญหา", value: "ALL" },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOptions() {
            try {
                const response = await fetch("/api/v2/master/filter-options");
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        setProblemCategories([
                            { label: "ทุกประเภทปัญหา", value: "ALL" },
                            ...result.data.problemCategories.map((p: any) => ({
                                label: p.problem_category_name_th,
                                value: p.problem_category_id.toString(),
                            })),
                        ]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch filter options", error);
            } finally {
                setLoading(false);
            }
        }
        fetchOptions();
    }, []);

    const quickFilters = [
        { id: "all", label: "ทั้งหมด", icon: <Users className="w-3.5 h-3.5" /> },
        { id: "high-risk", label: "ความเสี่ยงสูง", icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-red-600 bg-red-50" },
        { id: "new-cases", label: "เคสใหม่สัปดาห์นี้", icon: <Zap className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-50" },
    ];

    const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
        onFilterChange({ ...filters, startDate: range.from, endDate: range.to });
    };

    const handleFilterBarChange = (barFilters: any) => {
        const next: AdvisorDashboardFilters = {
            search: barFilters.search || filters.search,
            startDate: filters.startDate,
            endDate: filters.endDate,
        };

        if (barFilters.riskLevel && barFilters.riskLevel !== "ALL") {
            next.riskLevel = barFilters.riskLevel;
        }
        if (barFilters.problemCategoryId && barFilters.problemCategoryId !== "ALL") {
            next.problemCategoryId = Number(barFilters.problemCategoryId);
        }
        if (barFilters.gender && barFilters.gender !== "ALL") {
            next.gender = barFilters.gender;
        }

        onFilterChange(next);
    };

    // Convert typed filter values to string for FilterBar
    const barValue: Record<string, string> = {};
    if (filters.search) barValue.search = filters.search;
    if (filters.riskLevel) barValue.riskLevel = filters.riskLevel;
    if (filters.problemCategoryId) barValue.problemCategoryId = filters.problemCategoryId.toString();
    if (filters.gender) barValue.gender = filters.gender;

    const filterDefs = buildFilterDefs(problemCategories);

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 p-10 border border-slate-100 relative mb-8">
            {/* Background Accent */}
            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform">
                        <Filter className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">ระบบคัดกรองข้อมูลอัจฉริยะ</h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Advanced Multi-dimensional Data Filtering</p>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center gap-4 flex-wrap justify-end">
                    <div className="flex-1 hidden xl:block"></div>
                    {/* Quick Filters */}
                    <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 shrink-0 overflow-x-auto max-w-full">
                        {quickFilters.map(sf => (
                            <button
                                key={sf.id}
                                onClick={() => onQuickFilterChange(sf.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap
                   ${activeQuickFilter === sf.id
                                        ? "bg-white shadow-md text-indigo-600"
                                        : "text-slate-400 hover:text-slate-600"
                                    }
                 `}
                            >
                                {sf.icon}
                                {sf.label}
                            </button>
                        ))}
                    </div>

                    {/* Date Range Picker */}
                    <div className="flex-shrink-0">
                        <FacultyDateRangePicker
                            startDate={filters.startDate}
                            endDate={filters.endDate}
                            onChange={handleDateRangeChange}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse h-14 w-full bg-slate-50 rounded-2xl" />
            ) : (
                <FilterBar
                    defs={filterDefs}
                    value={barValue}
                    onChange={handleFilterBarChange}
                    searchKey="search"
                    searchPlaceholder="ค้นหาตามชื่อนิสิต, รหัสประจำตัว..."
                />
            )}
        </div>
    );
}
