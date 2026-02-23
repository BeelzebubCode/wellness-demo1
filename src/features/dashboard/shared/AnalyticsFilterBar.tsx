"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { FilterBar } from "@/components/filters/FilterBar";
import { DateCalendarPopover } from "@/components/filters/inputs/DateCalendarPopover";
import type { FilterDef } from "@/components/filters/types";
import type { AnalyticsParams, FacultyOption, ProblemCategoryOption } from "./analytics-types";
import { fetchFaculties, fetchProblemCategories, fetchRegions, fetchProvinces, fetchUniversities } from "./analytics-api";

export function AnalyticsFilterBar({
    params,
    onChange,
    hideFaculty = false,
    showNationalFilters = false,
}: {
    params: AnalyticsParams;
    onChange: (patch: Partial<AnalyticsParams>) => void;
    hideFaculty?: boolean;
    showNationalFilters?: boolean;
}) {
    const [regions, setRegions] = useState<any[]>([]);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [universities, setUniversities] = useState<any[]>([]);

    const [faculties, setFaculties] = useState<FacultyOption[]>([]);
    const [categories, setCategories] = useState<ProblemCategoryOption[]>([]);

    useEffect(() => {
        if (!showNationalFilters) {
            fetchFaculties().then(setFaculties).catch(() => { });
        }
        fetchProblemCategories().then(setCategories).catch(() => { });
    }, [showNationalFilters]);

    // Fetch Regions / Provinces / Universities for National Level
    useEffect(() => {
        if (!showNationalFilters) return;

        fetchRegions().then(setRegions).catch(() => { });

        fetchProvinces(params.region_id).then(setProvinces).catch(() => { });

        fetchUniversities(params.region_id, params.province_id).then(setUniversities).catch(() => { });

    }, [showNationalFilters, params.region_id, params.province_id]);

    const filterDefs = useMemo<FilterDef<any>[]>(() => {
        const defs: FilterDef<any>[] = [];

        if (showNationalFilters) {
            defs.push({
                key: "region_id",
                label: "ภูมิภาค",
                type: "searchable_select",
                options: regions.map(r => ({ value: r.region_id, label: r.region_name_th })),
                placeholder: "ทุกภูมิภาค",
                searchPlaceholder: "ค้นหาภูมิภาค..."
            });
            defs.push({
                key: "province_id",
                label: "จังหวัด",
                type: "searchable_select",
                options: provinces.map(p => ({ value: p.province_id, label: p.province_name_th })),
                placeholder: "ทุกจังหวัด",
                searchPlaceholder: "ค้นหาจังหวัด..."
            });
            defs.push({
                key: "university_type",
                label: "สังกัด",
                type: "searchable_select",
                options: [
                    { value: "SUPERVISED", label: "มหาวิทยาลัยในกำกับ" },
                    { value: "PUBLIC", label: "มหาวิทยาลัยรัฐ" },
                    { value: "PRIVATE", label: "มหาวิทยาลัยเอกชน" },
                ],
                placeholder: "ทุกสังกัด",
                searchPlaceholder: "ค้นหาสังกัด..."
            });
            defs.push({
                key: "university_id",
                label: "มหาวิทยาลัย",
                type: "searchable_select",
                options: universities.map(u => ({ value: u.university_id, label: u.university_name_th })),
                placeholder: "ทุกมหาวิทยาลัย",
                searchPlaceholder: "ค้นหามหาวิทยาลัย..."
            });
        }

        if (!hideFaculty && !showNationalFilters) {
            defs.push({
                key: "faculty_id",
                label: "คณะ",
                type: "searchable_select",
                options: faculties.map(f => ({ value: f.facultyId, label: f.facultyNameTh })),
                placeholder: "ทุกคณะ",
                searchPlaceholder: "ค้นหาคณะ..."
            });
        }

        defs.push({
            key: "gender",
            label: "เพศ",
            type: "searchable_select",
            options: [
                { value: "MALE", label: "ชาย" },
                { value: "FEMALE", label: "หญิง" },
                { value: "OTHER", label: "LGBTQ+" },
            ],
            placeholder: "ทุกเพศ",
            searchPlaceholder: "ค้นหาเพศ..."
        });

        defs.push({
            key: "problem_category_id",
            label: "หมวดปัญหา",
            type: "searchable_select",
            options: categories.map(c => ({ value: c.problemCategoryId, label: c.problemCategoryNameTh })),
            placeholder: "ทุกหมวดปัญหา",
            searchPlaceholder: "ค้นหาปัญหา..."
        });

        defs.push({
            key: "service_mode",
            label: "รูปแบบบริการ",
            type: "searchable_select",
            options: [
                { value: "ONLINE", label: "ออนไลน์" },
                { value: "ONSITE", label: "พบหน้า" },
            ],
            placeholder: "ทุกรูปแบบ",
            searchPlaceholder: "ค้นหารูปแบบ..."
        });

        defs.push({
            key: "booking_status_string",
            label: "สถานะ",
            type: "searchable_select",
            options: [
                { value: "COMPLETED", label: "เสร็จสิ้น" },
                { value: "CANCELLED", label: "ยกเลิก" },
                { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
                { value: "COMPLETED,CANCELLED", label: "เสร็จสิ้น + ยกเลิก" },
            ],
            placeholder: "ทุกสถานะ",
            searchPlaceholder: "ค้นหาสถานะ..."
        });

        return defs;
    }, [showNationalFilters, hideFaculty, regions, provinces, universities, faculties, categories]);

    const filterBarValue = useMemo(() => {
        const val: any = { ...params };
        if (params.booking_status && params.booking_status.length > 0) {
            val.booking_status_string = params.booking_status.join(",");
        }
        delete val.booking_status;
        return val;
    }, [params]);

    const handleFilterChange = (next: any) => {
        const patch: any = {};

        // 1. Check for removed keys and explicitly set them to undefined
        for (const key of Object.keys(filterBarValue)) {
            // we ignore date_start, date_end, all_time from FilterBar mapping since we handle those separately
            if (["date_start", "date_end", "all_time"].includes(key)) continue;

            if (!(key in next) || next[key] === undefined || next[key] === "") {
                if (key === 'booking_status_string') {
                    patch.booking_status = undefined;
                } else {
                    patch[key] = undefined;
                }
            }
        }

        // 2. Check for newly added or changed keys
        for (const key of Object.keys(next)) {
            if (["date_start", "date_end", "all_time"].includes(key)) continue;

            if (key === 'booking_status_string') {
                if (next[key] !== filterBarValue[key]) {
                    patch.booking_status = next[key] ? String(next[key]).split(",") : undefined;
                }
            } else if (next[key] !== filterBarValue[key]) {
                patch[key] = next[key];
            }
        }

        // 3. Handle cascading resets dynamically
        if ('region_id' in patch && patch.region_id !== params.region_id) {
            patch.province_id = undefined;
            patch.university_id = undefined;
        }
        if ('province_id' in patch && patch.province_id !== params.province_id) {
            patch.university_id = undefined;
        }
        if ('university_type' in patch && patch.university_type !== params.university_type) {
            patch.university_id = undefined;
        }
        if ('faculty_id' in patch && patch.faculty_id !== params.faculty_id) {
            patch.department_id = undefined;
        }

        onChange(patch);
    };

    return (
        <div className="relative z-[60] bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-3xl px-6 py-5 space-y-5 transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
            {/* Row 1: Dates + Quick Presets + All time toggle */}
            <div className="flex flex-wrap items-center gap-6">
                {/* Manual Dates */}
                <div className="flex items-center gap-2 bg-slate-100/40 p-1.5 rounded-[1.8rem] border border-slate-200/40 shadow-sm">
                    <DateCalendarPopover
                        valueYMD={params.date_start}
                        onChangeYMD={(ymd) => onChange({ date_start: ymd, all_time: false })}
                        placeholder="เริ่ม"
                        className="w-36 sm:w-40"
                    />
                    <div className="w-4 h-px bg-slate-200" />
                    <DateCalendarPopover
                        valueYMD={params.date_end}
                        onChangeYMD={(ymd) => onChange({ date_end: ymd, all_time: false })}
                        placeholder="สิ้นสุด"
                        className="w-36 sm:w-40"
                    />
                </div>

                {/* Separator - Visible only on large screens */}
                <div className="hidden xl:block w-px h-10 bg-slate-100 mx-1" />

                {/* Two-Tier Time Control */}
                <div className="flex-1 min-w-fit">
                    <TimeModeSlider
                        onChange={(start, end) => onChange({ date_start: start, date_end: end, all_time: false })}
                    />
                </div>

                {/* All-Time Toggle */}
                <button
                    type="button"
                    onClick={() => onChange({ all_time: !params.all_time })}
                    className={`group relative flex items-center gap-2 text-xs font-bold px-6 py-2.5 rounded-2xl transition-all duration-300 overflow-hidden ${params.all_time
                        ? "bg-primary text-white shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-primary/50 hover:bg-slate-50 shadow-sm"
                        }`}
                >
                    <div className="relative z-10 flex items-center gap-2">
                        {params.all_time ? <ToggleRight className="w-5 h-5 text-white" /> : <ToggleLeft className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />}
                        <span>ช่วงเวลาทั้งหมด</span>
                    </div>
                    {params.all_time && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                    )}
                </button>
            </div>

            {/* Row 2: Beautiful FilterBar */}
            <div className="pt-2">
                <FilterBar
                    defs={filterDefs}
                    value={filterBarValue}
                    onChange={handleFilterChange}
                />
            </div>
        </div>
    );
}

const MODES = [
    { label: "วัน", value: "DAYS" },
    { label: "เดือน", value: "MONTHS" },
    { label: "ปี", value: "YEARS" },
] as const;

type TimeMode = typeof MODES[number]["value"];

function TimeModeSlider({ onChange }: { onChange: (start: string, end: string) => void }) {
    const [mode, setMode] = useState<TimeMode>("DAYS");
    const [value, setValue] = useState(7);

    const values = useMemo(() => {
        if (mode === "DAYS") return [1, 3, 7, 14, 30];
        if (mode === "MONTHS") return [1, 3, 6, 9, 12];
        return [1, 3, 5, 7];
    }, [mode]);

    useEffect(() => {
        if (!values.includes(value)) setValue(values[2] || values[0]);
    }, [mode, values, value]);

    const handleSelect = (v: number) => {
        setValue(v);
        const end = new Date();
        const start = new Date();
        if (mode === "DAYS") start.setDate(end.getDate() - v);
        if (mode === "MONTHS") start.setMonth(end.getMonth() - v);
        if (mode === "YEARS") start.setFullYear(end.getFullYear() - v);

        const toYMD = (d: Date) => d.toISOString().split('T')[0];
        onChange(toYMD(start), toYMD(end));
    };

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Mode Picker */}
            <div className="relative flex p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50 w-full sm:w-auto">
                <div
                    className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm border border-slate-200/50 transition-all duration-500 ease-out"
                    style={{
                        left: `${MODES.findIndex(m => m.value === mode) * (100 / MODES.length)}%`,
                        width: `${100 / MODES.length}%`
                    }}
                />
                {MODES.map((m) => (
                    <button
                        key={m.value}
                        type="button"
                        onClick={() => setMode(m.value)}
                        className={`relative z-10 flex-1 sm:flex-none px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all duration-500 ${mode === m.value ? "text-primary" : "text-slate-400 hover:text-slate-600"
                            }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Value Picker */}
            <div className="relative flex p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50 overflow-x-auto no-scrollbar scrollbar-none w-full sm:w-auto min-w-[200px]">
                <div
                    className="absolute top-1 bottom-1 bg-white rounded-xl shadow-md border border-slate-200/50 transition-all duration-500 ease-out"
                    style={{
                        left: `${values.indexOf(value) * (100 / values.length)}%`,
                        width: `${100 / values.length}%`
                    }}
                />
                {values.map((v) => (
                    <button
                        key={v}
                        type="button"
                        onClick={() => handleSelect(v)}
                        className={`relative z-10 whitespace-nowrap px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all duration-500 flex-1 ${value === v ? "text-primary" : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        {v} {mode === "DAYS" ? "วัน" : mode === "MONTHS" ? "เดือน" : "ปี"}
                    </button>
                ))}
            </div>
        </div>
    );
}
