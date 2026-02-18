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
import { RectorDashboardFilters } from "../types";

interface FilterOptions {
    faculties: { faculty_id: number; faculty_name_th: string; faculty_name_en: string | null }[];
    departments: { department_id: number; department_name_th: string; department_name_en: string | null; faculty_id: number }[];
    problemCategories: { problem_category_id: number; problem_category_name_th: string; problem_category_name_en: string | null }[];
}

interface RectorAdvancedFilterProps {
    filters: RectorDashboardFilters;
    onFilterChange: (filters: RectorDashboardFilters) => void;
    activeQuickFilter: string;
    onQuickFilterChange: (id: string) => void;
}

// Build dynamic FilterDefs from API options
function buildFilterDefs(options: FilterOptions, filters: RectorDashboardFilters): FilterDef<any>[] {
    const facultyOptions = [
        { label: "ทุกคณะ", value: "ALL" },
        ...options.faculties.map(f => ({ label: f.faculty_name_th, value: f.faculty_id.toString() })),
    ];

    const deptOptions = filters.facultyId
        ? [
            { label: "ทุกภาควิชา", value: "ALL" },
            ...options.departments
                .filter(d => d.faculty_id === filters.facultyId)
                .map(d => ({ label: d.department_name_th, value: d.department_id.toString() })),
        ]
        : [{ label: "เลือกคณะก่อน", value: "ALL" }];

    const problemOptions = [
        { label: "ทุกประเภทปัญหา", value: "ALL" },
        ...options.problemCategories.map(p => ({ label: p.problem_category_name_th, value: p.problem_category_id.toString() })),
    ];

    const genderOptions = [
        { label: "ทุกเพศ", value: "ALL" },
        { label: "ชาย", value: "MALE" },
        { label: "หญิง", value: "FEMALE" },
        { label: "อื่นๆ", value: "OTHER" },
    ];

    return [
        { key: "facultyId", label: "คณะ (Faculty)", type: "select", options: facultyOptions },
        { key: "departmentId", label: "ภาควิชา (Department)", type: "select", options: deptOptions },
        { key: "problemCategoryId", label: "ประเภทปัญหา (Problem)", type: "select", options: problemOptions },
        { key: "gender", label: "เพศ (Gender)", type: "select", options: genderOptions },
    ];
}

export function RectorAdvancedFilter({
    filters,
    onFilterChange,
    activeQuickFilter,
    onQuickFilterChange,
}: RectorAdvancedFilterProps) {
    const [options, setOptions] = useState<FilterOptions>({ faculties: [], departments: [], problemCategories: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOptions() {
            try {
                const response = await fetch("/api/v2/master/filter-options");
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) setOptions(result.data);
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

    // Convert FilterBar values (string) to typed filter values
    const handleFilterBarChange = (barFilters: any) => {
        const next: RectorDashboardFilters = {
            startDate: filters.startDate,
            endDate: filters.endDate,
        };

        if (barFilters.facultyId && barFilters.facultyId !== "ALL") {
            next.facultyId = Number(barFilters.facultyId);
        }
        // Reset department if faculty changed
        if (barFilters.departmentId && barFilters.departmentId !== "ALL") {
            next.departmentId = Number(barFilters.departmentId);
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
    if (filters.facultyId) barValue.facultyId = filters.facultyId.toString();
    if (filters.departmentId) barValue.departmentId = filters.departmentId.toString();
    if (filters.problemCategoryId) barValue.problemCategoryId = filters.problemCategoryId.toString();
    if (filters.gender) barValue.gender = filters.gender;

    const filterDefs = buildFilterDefs(options, filters);

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 p-10 border border-slate-100 relative mb-8">
            {/* Background Accent */}
            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform">
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
                                        ? "bg-white shadow-md text-primary"
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
                    searchPlaceholder="ค้นหาตามชื่อคณะ, ภาควิชา, หรือประเภทปัญหา..."
                />
            )}
        </div>
    );
}
