"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { FilterBar } from "@/components/filters/FilterBar";
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
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl px-6 py-4 space-y-4">
            {/* Row 1: Dates + All time toggle */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <input
                        type="date"
                        value={params.date_start || ""}
                        onChange={(e) => onChange({ date_start: e.target.value })}
                        disabled={params.all_time}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white disabled:opacity-40 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none"
                    />
                    <span className="text-xs text-slate-400">ถึง</span>
                    <input
                        type="date"
                        value={params.date_end || ""}
                        onChange={(e) => onChange({ date_end: e.target.value })}
                        disabled={params.all_time}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white disabled:opacity-40 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => onChange({ all_time: !params.all_time })}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${params.all_time
                        ? "bg-primary text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                >
                    {params.all_time ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    ทั้งหมด
                </button>
            </div>

            {/* Row 2: Beautiful FilterBar */}
            <div className="-mx-4 -mb-4 pt-1 border-t border-slate-100 px-4 pb-4">
                <FilterBar
                    defs={filterDefs}
                    value={filterBarValue}
                    onChange={handleFilterChange}
                />
            </div>
        </div>
    );
}
