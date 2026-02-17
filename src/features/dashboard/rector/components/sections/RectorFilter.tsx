"use client";

import { useEffect, useState } from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { Select } from "@/components/ui/Select";
import { X } from "lucide-react";
import { RectorDashboardFilters } from "@/features/dashboard/rector/types";

interface RectorFilterProps {
    filters: RectorDashboardFilters;
    onFilterChange: (filters: RectorDashboardFilters) => void;
}

interface FilterOptions {
    faculties: { faculty_id: number; faculty_name_th: string; faculty_name_en: string | null }[];
    departments: { department_id: number; department_name_th: string; department_name_en: string | null; faculty_id: number }[];
    problemCategories: { problem_category_id: number; problem_category_name_th: string; problem_category_name_en: string | null }[];
}

export function RectorFilter({ filters, onFilterChange }: RectorFilterProps) {
    const [options, setOptions] = useState<FilterOptions>({ faculties: [], departments: [], problemCategories: [] });
    const [loading, setLoading] = useState(true);

    // Available departments based on selected faculty
    const [availableDepartments, setAvailableDepartments] = useState<{ label: string, value: string }[]>([]);

    useEffect(() => {
        async function fetchOptions() {
            try {
                const response = await fetch("/api/v2/master/filter-options");
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        setOptions(result.data);
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

    useEffect(() => {
        if (filters.facultyId) {
            const filtered = options.departments
                .filter(d => d.faculty_id === filters.facultyId)
                .map(d => ({ label: d.department_name_th, value: d.department_id.toString() }));
            setAvailableDepartments([{ label: "ทุกภาควิชา", value: "0" }, ...filtered]);
        } else {
            setAvailableDepartments([]);
        }
    }, [filters.facultyId, options.departments]);

    const handleDateChange = (range: { from?: Date; to?: Date }) => {
        onFilterChange({ ...filters, startDate: range.from, endDate: range.to });
    };

    const handleValueChange = (key: keyof RectorDashboardFilters, value: string) => {
        const numValue = value && value !== "0" ? Number(value) : undefined;
        const strValue = value && value !== "0" ? value : undefined;

        // Reset department if faculty changes
        if (key === 'facultyId') {
            onFilterChange({ ...filters, [key]: numValue, departmentId: undefined });
        } else {
            onFilterChange({ ...filters, [key]: key === 'gender' ? strValue : numValue });
        }
    };

    const clearFilters = () => {
        // Keep date default if needed, or reset all. Usually dashboard needs *some* date.
        // We'll keep date but reset others.
        onFilterChange({
            startDate: filters.startDate,
            endDate: filters.endDate,
            facultyId: undefined,
            departmentId: undefined,
            problemCategoryId: undefined,
            gender: undefined
        });
    };

    if (loading) return <div className="animate-pulse h-10 w-full bg-slate-100 rounded-lg"></div>;

    const facultyOptions = [
        { label: "ทุกคณะ", value: "0" },
        ...options.faculties.map(f => ({ label: f.faculty_name_th, value: f.faculty_id.toString() }))
    ];

    const problemOptions = [
        { label: "ทุกประเภทปัญหา", value: "0" },
        ...options.problemCategories.map(p => ({ label: p.problem_category_name_th, value: p.problem_category_id.toString() }))
    ];

    const genderOptions = [
        { label: "ทุกเพศ", value: "0" },
        { label: "ชาย", value: "MALE" },
        { label: "หญิง", value: "FEMALE" },
        { label: "อื่นๆ", value: "OTHER" }
    ];

    return (
        <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">ตัวกรองข้อมูล (Filters)</span>
                {(filters.facultyId || filters.departmentId || filters.problemCategoryId || filters.gender) && (
                    <button
                        onClick={clearFilters}
                        className="text-xs text-red-500 flex items-center gap-1 hover:underline"
                    >
                        <X size={12} /> ล้างตัวกรองทั้งหมด
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Date Range */}
                <div className="lg:col-span-1">
                    <DateRangePicker
                        startDate={filters.startDate}
                        endDate={filters.endDate}
                        onChange={handleDateChange}
                    />
                </div>

                {/* Faculty */}
                <Select
                    placeholder="เลือกคณะ"
                    options={facultyOptions}
                    value={filters.facultyId?.toString() || "0"}
                    onValueChange={(val) => handleValueChange("facultyId", val)}
                    className="text-xs"
                />

                {/* Department (Dependent) */}
                <Select
                    placeholder="เลือกภาควิชา"
                    options={availableDepartments}
                    value={filters.departmentId?.toString() || "0"}
                    onValueChange={(val) => handleValueChange("departmentId", val)}
                    disabled={!filters.facultyId}
                    className="text-xs"
                />

                {/* Problem Category */}
                <Select
                    placeholder="เลือกประเภทปัญหา"
                    options={problemOptions}
                    value={filters.problemCategoryId?.toString() || "0"}
                    onValueChange={(val) => handleValueChange("problemCategoryId", val)}
                    className="text-xs"
                />

                {/* Gender */}
                <Select
                    placeholder="เพศ"
                    options={genderOptions}
                    value={filters.gender || "0"}
                    onValueChange={(val) => handleValueChange("gender", val)}
                    className="text-xs"
                />
            </div>
        </div>
    );
}
