// src/features/dashboard/widgets/filters/DashboardFilterBar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Config-driven filter bar — reads FILTER_CONFIGS[role] to decide which
// filter fields to render. No more boolean props!
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
    Calendar, ToggleLeft, ToggleRight, Globe, Building2,
    MapPin, Landmark, X, RotateCcw, GraduationCap, Building,
} from "lucide-react";
import { DateCalendarPopover } from "@/components/filters/inputs/DateCalendarPopover";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { getFilterConfig, type FilterFieldConfig, type FilterFieldId } from "../../registry/filter-config";
import type { AnalyticsParams, FacultyOption, ProblemCategoryOption } from "../types/analytics-types";
import {
    fetchFaculties, fetchProblemCategories,
    fetchRegions, fetchProvinces, fetchUniversities,
    fetchDepartments,
} from "../api/analytics-api";

// ─── Toggle chip for multi-select ──────────────────────────────────────────
function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${active
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
                }`}
        >
            {label}
            {active && <X className="w-3 h-3 ml-0.5 opacity-80" />}
        </button>
    );
}

// ─── Filter group row ──────────────────────────────────────────────────────
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-1 min-w-[60px] shrink-0">
                {label}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">{children}</div>
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function toggleArray<T>(arr: T[] | undefined, val: T): T[] | undefined {
    const set = new Set(arr ?? []);
    if (set.has(val)) set.delete(val); else set.add(val);
    return set.size > 0 ? Array.from(set) : undefined;
}

function toggleNumberArray(arr: number[] | undefined, val: number): number[] | undefined {
    const set = new Set(arr ?? []);
    if (set.has(val)) set.delete(val); else set.add(val);
    return set.size > 0 ? Array.from(set) : undefined;
}

// ─── Time Mode Slider ──────────────────────────────────────────────────────
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
                        className={`relative z-10 flex-1 sm:flex-none px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all duration-500 ${mode === m.value ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

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
                        className={`relative z-10 whitespace-nowrap px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all duration-500 flex-1 ${value === v ? "text-primary" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        {v} {mode === "DAYS" ? "วัน" : mode === "MONTHS" ? "เดือน" : "ปี"}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function DashboardFilterBar({
    role,
    params,
    onChange,
}: {
    role: string;
    params: AnalyticsParams;
    onChange: (patch: Partial<AnalyticsParams>) => void;
}) {
    const fields = getFilterConfig(role);

    // ── Data state for dynamic options ──────────────────────────────────────
    const [regions, setRegions] = useState<any[]>([]);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [universities, setUniversities] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<FacultyOption[]>([]);
    const [categories, setCategories] = useState<ProblemCategoryOption[]>([]);
    const [chronicConditions, setChronicConditions] = useState<{ id: number; code: string; nameTh: string }[]>([]);

    const hasField = useCallback(
        (id: FilterFieldId) => fields.some((f) => f.id === id),
        [fields],
    );

    // ── Fetch location data ────────────────────────────────────────────────
    useEffect(() => {
        if (hasField('region')) fetchRegions().then(setRegions).catch(() => { });
        if (hasField('province')) fetchProvinces(params.region_id).then(setProvinces).catch(() => { });
        if (hasField('university'))
            fetchUniversities(params.region_id, params.province_id).then(setUniversities).catch(() => { });
    }, [hasField, params.region_id, params.province_id]);

    // ── Fetch scope data ───────────────────────────────────────────────────
    useEffect(() => {
        if (hasField('faculty')) fetchFaculties().then(setFaculties).catch(() => { });
        if (hasField('problem_category')) fetchProblemCategories().then(setCategories).catch(() => { });
        if (hasField('chronic_condition')) {
            fetch('/api/v2/analytics/chronic-conditions', { credentials: 'include' })
                .then(r => r.json())
                .then(j => setChronicConditions(j.data ?? []))
                .catch(() => { });
        }
    }, [hasField]);

    // ── Computed options ───────────────────────────────────────────────────
    const regionOptions = useMemo(() => regions.map(r => ({ value: String(r.region_id), label: r.region_name_th })), [regions]);
    const provinceOptions = useMemo(() => provinces.map(p => ({ value: String(p.province_id), label: p.province_name_th })), [provinces]);
    const universityOptions = useMemo(() => universities.map(u => ({ value: String(u.university_id), label: u.university_name_th })), [universities]);
    const universityTypeOptions = useMemo(() => [
        { value: "SUPERVISED", label: "ในกำกับ" },
        { value: "PUBLIC", label: "รัฐ" },
        { value: "PRIVATE", label: "เอกชน" },
    ], []);

    const handleLocationChange = useCallback((key: string, val: string | undefined) => {
        const numVal = val ? Number(val) : undefined;
        const patch: Partial<AnalyticsParams> = { [key]: key === "university_type" ? val : numVal };
        if (key === "region_id") { patch.province_id = undefined; patch.university_id = undefined; }
        if (key === "province_id") { patch.university_id = undefined; }
        if (key === "university_type") { patch.university_id = undefined; }
        onChange(patch);
    }, [onChange]);

    // ── Check if any advanced filters are active ──────────────────────────
    const hasActiveFilters = !!(
        params.gender?.length || params.problem_category_ids?.length ||
        params.service_mode?.length || params.booking_status?.length ||
        params.attendance_status?.length || params.faculty_id || params.faculty_ids?.length ||
        params.family_income_bracket?.length || params.blood_group?.length ||
        params.birth_order?.length || params.chronic_condition_ids?.length ||
        params.parental_status?.length
    );

    const clearAllFilters = useCallback(() => {
        onChange({
            gender: undefined,
            problem_category_ids: undefined,
            service_mode: undefined,
            booking_status: undefined,
            attendance_status: undefined,
            faculty_id: undefined,
            faculty_ids: undefined,
            family_income_bracket: undefined,
            blood_group: undefined,
            birth_order: undefined,
            chronic_condition_ids: undefined,
            parental_status: undefined,
        });
    }, [onChange]);

    return (
        <div className="relative z-[60] bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-3xl px-6 py-5 space-y-5 transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
            {/* Row 1: Date Range + Time Mode + All Time */}
            {hasField('date_range') && (
                <div className="flex flex-wrap items-center gap-6">
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

                    <div className="hidden xl:block w-px h-10 bg-slate-100 mx-1" />

                    <div className="flex-1 min-w-fit">
                        <TimeModeSlider
                            onChange={(start, end) => onChange({ date_start: start, date_end: end, all_time: false })}
                        />
                    </div>

                    {hasField('all_time') && (
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
                    )}

                    {hasActiveFilters && (
                        <button type="button" onClick={clearAllFilters}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors border border-rose-100 shadow-sm ml-auto">
                            <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรอง
                        </button>
                    )}
                </div>
            )}

            {/* Row 2: Location filters (driven by config) */}
            {(hasField('region') || hasField('province') || hasField('university_type') || hasField('university')) && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
                    {hasField('region') && (
                        <div className="space-y-0.5">
                            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-400"><Globe className="w-3 h-3" /> ภูมิภาค</label>
                            <SearchableSelect options={regionOptions} value={params.region_id ? String(params.region_id) : undefined}
                                onValueChange={(v) => handleLocationChange("region_id", v)} placeholder="ทุกภูมิภาค" searchPlaceholder="ค้นหาภูมิภาค..." />
                        </div>
                    )}
                    {hasField('province') && (
                        <div className="space-y-0.5">
                            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-400"><MapPin className="w-3 h-3" /> จังหวัด</label>
                            <SearchableSelect options={provinceOptions} value={params.province_id ? String(params.province_id) : undefined}
                                onValueChange={(v) => handleLocationChange("province_id", v)} placeholder="ทุกจังหวัด" searchPlaceholder="ค้นหาจังหวัด..." />
                        </div>
                    )}
                    {hasField('university_type') && (
                        <div className="space-y-0.5">
                            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-400"><Landmark className="w-3 h-3" /> สังกัด</label>
                            <SearchableSelect options={universityTypeOptions} value={params.university_type || undefined}
                                onValueChange={(v) => handleLocationChange("university_type", v)} placeholder="ทุกสังกัด" searchPlaceholder="ค้นหาสังกัด..." />
                        </div>
                    )}
                    {hasField('university') && (
                        <div className="space-y-0.5">
                            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-400"><Building2 className="w-3 h-3" /> มหาวิทยาลัย</label>
                            <SearchableSelect options={universityOptions} value={params.university_id ? String(params.university_id) : undefined}
                                onValueChange={(v) => handleLocationChange("university_id", v)} placeholder="ทุกมหาวิทยาลัย" searchPlaceholder="ค้นหามหาวิทยาลัย..." />
                        </div>
                    )}
                </div>
            )}

            {/* Row 3: Toggle chip filters (driven by config) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
                {/* Faculty */}
                {hasField('faculty') && faculties.length > 0 && (
                    <FilterGroup label="คณะ">
                        {faculties.map(f => (
                            <ToggleChip key={f.facultyId} label={f.facultyNameTh}
                                active={params.faculty_id === f.facultyId || !!params.faculty_ids?.includes(f.facultyId)}
                                onClick={() => onChange({
                                    faculty_ids: toggleNumberArray(params.faculty_ids, f.facultyId),
                                    faculty_id: undefined,
                                    department_id: undefined
                                })} />
                        ))}
                    </FilterGroup>
                )}

                {/* Gender */}
                {hasField('gender') && (
                    <FilterGroup label="เพศ">
                        <ToggleChip label="ชาย" active={!!params.gender?.includes("MALE")}
                            onClick={() => onChange({ gender: toggleArray(params.gender, "MALE") })} />
                        <ToggleChip label="หญิง" active={!!params.gender?.includes("FEMALE")}
                            onClick={() => onChange({ gender: toggleArray(params.gender, "FEMALE") })} />
                        <ToggleChip label="LGBTQ+" active={!!params.gender?.includes("LGBTQ_PLUS")}
                            onClick={() => onChange({ gender: toggleArray(params.gender, "LGBTQ_PLUS") })} />
                    </FilterGroup>
                )}

                {/* Problem Categories */}
                {hasField('problem_category') && categories.length > 0 && (
                    <FilterGroup label="ปัญหา">
                        {categories.map(c => (
                            <ToggleChip key={c.problemCategoryId} label={c.problemCategoryNameTh}
                                active={!!params.problem_category_ids?.includes(c.problemCategoryId)}
                                onClick={() => onChange({ problem_category_ids: toggleNumberArray(params.problem_category_ids, c.problemCategoryId) })} />
                        ))}
                    </FilterGroup>
                )}

                {/* Service Mode */}
                {hasField('service_mode') && (
                    <FilterGroup label="บริการ">
                        <ToggleChip label="ออนไลน์" active={!!params.service_mode?.includes("ONLINE")}
                            onClick={() => onChange({ service_mode: toggleArray(params.service_mode, "ONLINE") })} />
                        <ToggleChip label="ออนไซต์" active={!!params.service_mode?.includes("ONSITE")}
                            onClick={() => onChange({ service_mode: toggleArray(params.service_mode, "ONSITE") })} />
                    </FilterGroup>
                )}

                {/* Booking Status */}
                {hasField('booking_status') && (
                    <FilterGroup label="สถานะจอง">
                        <ToggleChip label="รอดำเนินการ" active={!!params.booking_status?.includes("PENDING_ASSIGNMENT")}
                            onClick={() => onChange({ booking_status: toggleArray(params.booking_status, "PENDING_ASSIGNMENT") })} />
                        <ToggleChip label="ยืนยันแล้ว" active={!!params.booking_status?.includes("ASSIGNED")}
                            onClick={() => onChange({ booking_status: toggleArray(params.booking_status, "ASSIGNED") })} />
                        <ToggleChip label="กำลังดำเนินการ" active={!!params.booking_status?.includes("IN_PROGRESS")}
                            onClick={() => onChange({ booking_status: toggleArray(params.booking_status, "IN_PROGRESS") })} />
                        <ToggleChip label="เสร็จสิ้น" active={!!params.booking_status?.includes("COMPLETED")}
                            onClick={() => onChange({ booking_status: toggleArray(params.booking_status, "COMPLETED") })} />
                        <ToggleChip label="ยกเลิก" active={!!params.booking_status?.includes("CANCELLED")}
                            onClick={() => onChange({ booking_status: toggleArray(params.booking_status, "CANCELLED") })} />
                    </FilterGroup>
                )}

                {/* Attendance Status */}
                {hasField('attendance_status') && (
                    <FilterGroup label="การเข้าพบ">
                        <ToggleChip label="เข้าพบ" active={!!params.attendance_status?.includes("CHECKED_IN")}
                            onClick={() => onChange({ attendance_status: toggleArray(params.attendance_status, "CHECKED_IN") })} />
                        <ToggleChip label="มาสาย" active={!!params.attendance_status?.includes("LATE")}
                            onClick={() => onChange({ attendance_status: toggleArray(params.attendance_status, "LATE") })} />
                        <ToggleChip label="ไม่มาตามนัด" active={!!params.attendance_status?.includes("NO_SHOW")}
                            onClick={() => onChange({ attendance_status: toggleArray(params.attendance_status, "NO_SHOW") })} />
                    </FilterGroup>
                )}

                {/* Family Income */}
                {hasField('family_income') && (
                    <FilterGroup label="รายได้">
                        <ToggleChip label="< 100K" active={!!params.family_income_bracket?.includes("UNDER_100K")}
                            onClick={() => onChange({ family_income_bracket: toggleArray(params.family_income_bracket, "UNDER_100K") })} />
                        <ToggleChip label="100-200K" active={!!params.family_income_bracket?.includes("BETWEEN_100K_200K")}
                            onClick={() => onChange({ family_income_bracket: toggleArray(params.family_income_bracket, "BETWEEN_100K_200K") })} />
                        <ToggleChip label="200-300K" active={!!params.family_income_bracket?.includes("BETWEEN_200K_300K")}
                            onClick={() => onChange({ family_income_bracket: toggleArray(params.family_income_bracket, "BETWEEN_200K_300K") })} />
                        <ToggleChip label="300-500K" active={!!params.family_income_bracket?.includes("BETWEEN_300K_500K")}
                            onClick={() => onChange({ family_income_bracket: toggleArray(params.family_income_bracket, "BETWEEN_300K_500K") })} />
                        <ToggleChip label="500-800K" active={!!params.family_income_bracket?.includes("BETWEEN_500K_800K")}
                            onClick={() => onChange({ family_income_bracket: toggleArray(params.family_income_bracket, "BETWEEN_500K_800K") })} />
                        <ToggleChip label="800K-1M" active={!!params.family_income_bracket?.includes("BETWEEN_800K_1M")}
                            onClick={() => onChange({ family_income_bracket: toggleArray(params.family_income_bracket, "BETWEEN_800K_1M") })} />
                        <ToggleChip label="> 1M" active={!!params.family_income_bracket?.includes("OVER_1M")}
                            onClick={() => onChange({ family_income_bracket: toggleArray(params.family_income_bracket, "OVER_1M") })} />
                    </FilterGroup>
                )}

                {/* Blood Group */}
                {hasField('blood_group') && (
                    <FilterGroup label="กรุ๊ปเลือด">
                        <ToggleChip label="A" active={!!params.blood_group?.includes("A")}
                            onClick={() => onChange({ blood_group: toggleArray(params.blood_group, "A") })} />
                        <ToggleChip label="B" active={!!params.blood_group?.includes("B")}
                            onClick={() => onChange({ blood_group: toggleArray(params.blood_group, "B") })} />
                        <ToggleChip label="AB" active={!!params.blood_group?.includes("AB")}
                            onClick={() => onChange({ blood_group: toggleArray(params.blood_group, "AB") })} />
                        <ToggleChip label="O" active={!!params.blood_group?.includes("O")}
                            onClick={() => onChange({ blood_group: toggleArray(params.blood_group, "O") })} />
                    </FilterGroup>
                )}

                {/* Birth Order */}
                {hasField('birth_order') && (
                    <FilterGroup label="ลำดับบุตร">
                        <ToggleChip label="ลูกคนเดียว" active={!!params.birth_order?.includes("ONLY_CHILD")}
                            onClick={() => onChange({ birth_order: toggleArray(params.birth_order, "ONLY_CHILD") })} />
                        <ToggleChip label="บุตรคนที่ 1" active={!!params.birth_order?.includes("1")}
                            onClick={() => onChange({ birth_order: toggleArray(params.birth_order, "1") })} />
                        <ToggleChip label="บุตรคนที่ 2" active={!!params.birth_order?.includes("2")}
                            onClick={() => onChange({ birth_order: toggleArray(params.birth_order, "2") })} />
                        <ToggleChip label="บุตรคนที่ 3" active={!!params.birth_order?.includes("3")}
                            onClick={() => onChange({ birth_order: toggleArray(params.birth_order, "3") })} />
                        <ToggleChip label="บุตรคนที่ 4+" active={!!params.birth_order?.includes("4_PLUS")}
                            onClick={() => onChange({ birth_order: toggleArray(params.birth_order, "4_PLUS") })} />
                    </FilterGroup>
                )}

                {/* Chronic Conditions */}
                {hasField('chronic_condition') && chronicConditions.length > 0 && (
                    <FilterGroup label="โรคประจำตัว">
                        {chronicConditions.map(c => (
                            <ToggleChip key={c.id} label={c.nameTh}
                                active={!!params.chronic_condition_ids?.includes(c.id)}
                                onClick={() => onChange({ chronic_condition_ids: toggleNumberArray(params.chronic_condition_ids, c.id) })} />
                        ))}
                    </FilterGroup>
                )}

                {/* Parental Status */}
                {hasField('parental_status') && (
                    <FilterGroup label="สถานะครอบครัว">
                        <ToggleChip label="พ่อแม่อยู่ด้วยกัน" active={!!params.parental_status?.includes("TOGETHER")}
                            onClick={() => onChange({ parental_status: toggleArray(params.parental_status, "TOGETHER") })} />
                        <ToggleChip label="หย่าร้าง" active={!!params.parental_status?.includes("DIVORCED")}
                            onClick={() => onChange({ parental_status: toggleArray(params.parental_status, "DIVORCED") })} />
                        <ToggleChip label="บิดาเสียชีวิต" active={!!params.parental_status?.includes("FATHER_DECEASED")}
                            onClick={() => onChange({ parental_status: toggleArray(params.parental_status, "FATHER_DECEASED") })} />
                        <ToggleChip label="มารดาเสียชีวิต" active={!!params.parental_status?.includes("MOTHER_DECEASED")}
                            onClick={() => onChange({ parental_status: toggleArray(params.parental_status, "MOTHER_DECEASED") })} />
                        <ToggleChip label="เสียชีวิตทั้งคู่" active={!!params.parental_status?.includes("BOTH_DECEASED")}
                            onClick={() => onChange({ parental_status: toggleArray(params.parental_status, "BOTH_DECEASED") })} />
                        <ToggleChip label="เลี้ยงเดี่ยว" active={!!params.parental_status?.includes("SINGLE_PARENT")}
                            onClick={() => onChange({ parental_status: toggleArray(params.parental_status, "SINGLE_PARENT") })} />
                    </FilterGroup>
                )}
            </div>
        </div>
    );
}
