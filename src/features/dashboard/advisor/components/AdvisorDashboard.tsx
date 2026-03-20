// src/features/dashboard/advisor/components/AdvisorDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Advisor Dashboard — 6 independent cards, each with its OWN inline filters
// Default: show ALL data, simple preset chips for time filtering
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
    Users, TrendingUp, CreditCard, ShieldAlert, PieChart as PieIcon,
    GitCompareArrows, Droplets, Heart, GraduationCap, AlertTriangle,
    Calendar, StickyNote, CheckCircle, ClipboardList, X, Phone, RotateCcw, Wallet,
} from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryFilterStack, StoryChipGroup } from "../../widgets/story/StoryFilterChips";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";

// ─── Constants ──────────────────────────────────────────────────────────────
const API = "/api/v2/dashboards/advisor/detail";

const PIE_COLORS = [
    "#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
    "#84cc16", "#ef4444", "#0ea5e9", "#a855f7", "#64748b",
];

const RISK_BADGE: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: "ปกติ", color: "#10b981", bg: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    2: { label: "ต่ำ", color: "#06b6d4", bg: "bg-cyan-50 border-cyan-200 text-cyan-700" },
    3: { label: "ปานกลาง", color: "#f59e0b", bg: "bg-amber-50 border-amber-200 text-amber-700" },
    4: { label: "สูง", color: "#f43f5e", bg: "bg-rose-50 border-rose-200 text-rose-700" },
    5: { label: "วิกฤต", color: "#7c3aed", bg: "bg-purple-50 border-purple-200 text-purple-700" },
};

const MONTH_LABEL: Record<string, string> = {
    "01": "ม.ค.", "02": "ก.พ.", "03": "มี.ค.", "04": "เม.ย.",
    "05": "พ.ค.", "06": "มิ.ย.", "07": "ก.ค.", "08": "ส.ค.",
    "09": "ก.ย.", "10": "ต.ค.", "11": "พ.ย.", "12": "ธ.ค.",
};

const GENDER_OPTS = [
    { value: "MALE", label: "ชาย" }, { value: "FEMALE", label: "หญิง" }, { value: "LGBTQ_PLUS", label: "LGBTQ+" },
];
const INCOME_OPTS = [
    { value: "UNDER_100K", label: "< 100K" }, { value: "BETWEEN_100K_200K", label: "100-200K" },
    { value: "BETWEEN_200K_300K", label: "200-300K" }, { value: "BETWEEN_300K_500K", label: "300-500K" },
    { value: "BETWEEN_500K_800K", label: "500-800K" }, { value: "BETWEEN_800K_1M", label: "800K-1M" },
    { value: "OVER_1M", label: "> 1M" },
];
const FAMILY_OPTS = [
    { value: "TOGETHER", label: "อยู่ด้วยกัน" }, { value: "DIVORCED", label: "หย่าร้าง" },
    { value: "FATHER_DECEASED", label: "บิดาเสียชีวิต" }, { value: "MOTHER_DECEASED", label: "มารดาเสียชีวิต" },
    { value: "BOTH_DECEASED", label: "เสียชีวิตทั้งคู่" }, { value: "SINGLE_PARENT", label: "เลี้ยงเดี่ยว" },
];
const YEAR_OPTS = [
    { value: "1", label: "ปี 1" }, { value: "2", label: "ปี 2" },
    { value: "3", label: "ปี 3" }, { value: "4", label: "ปี 4" },
];

// ─── Time period options ────────────────────────────────────────────────────
type TimePeriod = "all" | "1m" | "3m" | "6m" | "1y" | "custom";

const TIME_PERIOD_OPTS: { value: TimePeriod; label: string }[] = [
    { value: "all", label: "ทั้งหมด" },
    { value: "1m", label: "เดือนนี้" },
    { value: "3m", label: "3 เดือน" },
    { value: "6m", label: "6 เดือน" },
    { value: "1y", label: "ปีนี้" },
    { value: "custom", label: "กำหนดเอง" },
];

function getTimePeriodDates(period: TimePeriod, customStart?: string, customEnd?: string): { dateStart?: string; dateEnd?: string } {
    if (period === "all") return {};
    if (period === "custom") return { dateStart: customStart, dateEnd: customEnd };
    const now = new Date();
    const end = now.toISOString().split("T")[0];
    let start: Date;
    switch (period) {
        case "1m": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case "3m": start = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
        case "6m": start = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
        case "1y": start = new Date(now.getFullYear(), 0, 1); break;
        default: start = new Date(now.getFullYear(), 0, 1);
    }
    return { dateStart: start.toISOString().split("T")[0], dateEnd: end };
}

function getTimePeriodLabel(period: TimePeriod, customStart?: string, customEnd?: string, dataRange?: { minDate: string; maxDate: string } | null): string {
    const fmt = (d: string) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
    const fmtMonth = (ym: string) => {
        const [y, m] = ym.split("-");
        const d = new Date(Number(y), Number(m) - 1, 1);
        return d.toLocaleDateString("th-TH", { month: "short", year: "numeric" });
    };
    if (period === "all") {
        if (dataRange?.minDate && dataRange?.maxDate) {
            return `ข้อมูลตั้งแต่ ${dataRange.minDate.length <= 7 ? fmtMonth(dataRange.minDate) : fmt(dataRange.minDate)} ถึง ${dataRange.maxDate.length <= 7 ? fmtMonth(dataRange.maxDate) : fmt(dataRange.maxDate)}`;
        }
        return "ข้อมูลทั้งหมด";
    }
    const { dateStart, dateEnd } = getTimePeriodDates(period, customStart, customEnd);
    if (!dateStart && !dateEnd) return "กรุณาเลือกวันที่";
    return `แสดงข้อมูล ${dateStart ? fmt(dateStart) : "..."} ถึง ${dateEnd ? fmt(dateEnd) : "ปัจจุบัน"}`;
}

// ─── Time Period Chips + inline custom range ────────────────────────────────
function TimePeriodChips({ value, onChange, customStart, customEnd, onCustomChange }: {
    value: TimePeriod;
    onChange: (v: TimePeriod) => void;
    customStart?: string;
    customEnd?: string;
    onCustomChange?: (start: string, end: string) => void;
}) {
    const handlePresetClick = (v: TimePeriod) => {
        if (v === "custom" && !customStart && onCustomChange) {
            // Set sensible defaults: 1 year ago → today
            const now = new Date();
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            onCustomChange(yearAgo.toISOString().split("T")[0], now.toISOString().split("T")[0]);
        }
        onChange(v);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 min-w-[50px]">ช่วงเวลา</span>
                <div className="flex flex-wrap gap-1.5">
                    {TIME_PERIOD_OPTS.map(opt => (
                        <button key={opt.value} onClick={() => handlePresetClick(opt.value)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 border
                                ${value === opt.value
                                    ? "bg-teal-500 text-white border-teal-500 shadow-sm shadow-teal-200"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-teal-300 hover:text-teal-600"}`}>
                            {opt.value === "custom" && <Calendar className="w-3 h-3 inline -mt-px mr-0.5" />}
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inline custom date range — clean labeled inputs */}
            {value === "custom" && (
                <div className="flex items-center gap-3 ml-[62px] animate-[fadeUp_0.2s_ease-out_both]">
                    <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-semibold text-slate-500">เริ่มต้น</label>
                        <input type="date" value={customStart ?? ""}
                            onChange={e => onCustomChange?.(e.target.value, customEnd ?? new Date().toISOString().split("T")[0])}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white
                                       hover:border-teal-300 focus:ring-2 focus:ring-teal-200 focus:border-teal-400
                                       outline-none transition-all cursor-pointer" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">ถึง</span>
                    <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-semibold text-slate-500">สิ้นสุด</label>
                        <input type="date" value={customEnd ?? ""}
                            onChange={e => onCustomChange?.(customStart ?? "2019-01-01", e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white
                                       hover:border-teal-300 focus:ring-2 focus:ring-teal-200 focus:border-teal-400
                                       outline-none transition-all cursor-pointer" />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface CardFilters {
    gender: string[];
    incomeBracket: string[];
    parentalStatus: string[];
    problemCategoryIds: string[];
    academicYear: string[];
    seasonIds: string[];
    bloodGroup: string[];
    educationLevel: string[];
    serviceMode: string[];
    timePeriod: TimePeriod;
    customStart?: string;
    customEnd?: string;
}

const DEFAULT_FILTERS: CardFilters = {
    gender: [], incomeBracket: [], parentalStatus: [],
    problemCategoryIds: [], academicYear: [], seasonIds: [],
    bloodGroup: [], educationLevel: [], serviceMode: [],
    timePeriod: "all",  // Default = ทั้งหมด
};

function isFiltersDirty(f: CardFilters): boolean {
    return f.gender.length > 0 || f.incomeBracket.length > 0 || f.parentalStatus.length > 0
        || f.problemCategoryIds.length > 0 || f.academicYear.length > 0 || f.seasonIds.length > 0
        || f.bloodGroup.length > 0 || f.educationLevel.length > 0 || f.serviceMode.length > 0
        || f.timePeriod !== "all" || !!f.customStart || !!f.customEnd;
}

function ResetFilterButton({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                       text-rose-500 bg-rose-50 border border-rose-200 hover:bg-rose-100
                       transition-all duration-200">
            <RotateCcw className="w-3.5 h-3.5" />
            ล้างตัวกรอง
        </button>
    );
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900/95 backdrop-blur rounded-xl shadow-2xl px-4 py-2.5 text-xs border border-white/10 z-50">
            <p className="font-bold text-white/70 mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-white/50">{p.name}:</span>
                    <span className="font-bold text-white">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Hook: fetch section data with per-card filters ─────────────────────────
function useCardData(section: string, filters: CardFilters) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dataRange, setDataRange] = useState<{ minDate: string; maxDate: string } | null>(null);

    const fetchKey = JSON.stringify({ section, ...filters });

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const sp = new URLSearchParams();
                sp.set("section", section);
                if (filters.gender.length) sp.set("gender", filters.gender.join(","));
                if (filters.incomeBracket.length) sp.set("income_bracket", filters.incomeBracket.join(","));
                if (filters.parentalStatus.length) sp.set("parental_status", filters.parentalStatus.join(","));
                if (filters.problemCategoryIds.length) sp.set("problem_category_ids", filters.problemCategoryIds.join(","));
                if (filters.academicYear.length) {
                    const admitYears = filters.academicYear.map(y => 2569 - Number(y));
                    sp.set("academic_year", admitYears.join(","));
                }
                if (filters.seasonIds.length) sp.set("season_ids", filters.seasonIds.join(","));
                if (filters.bloodGroup.length) sp.set("blood_group", filters.bloodGroup.join(","));
                if (filters.educationLevel.length) sp.set("education_level", filters.educationLevel.join(","));
                if (filters.serviceMode.length) sp.set("service_mode", filters.serviceMode.join(","));

                // Time period → date params (supports custom)
                const { dateStart, dateEnd } = getTimePeriodDates(filters.timePeriod, filters.customStart, filters.customEnd);
                if (dateStart) sp.set("date_start", dateStart);
                if (dateEnd) sp.set("date_end", dateEnd);

                const res = await fetch(`${API}?${sp}`, { credentials: "include" });
                if (cancelled) return;
                const json = await res.json();
                if (cancelled) return;
                if (json.success) {
                    setData(json.data);
                    if (json.data?.dataRange) setDataRange(json.data.dataRange);
                }
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        }, 200);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [fetchKey]);

    return { data, loading, dataRange };
}

// ─── Date Range Label badge ─────────────────────────────────────────────────
function DateRangeBadge({ period, customStart, customEnd, dataRange }: { period: TimePeriod; customStart?: string; customEnd?: string; dataRange?: { minDate: string; maxDate: string } | null }) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 w-fit">
            <Calendar className="w-3.5 h-3.5 text-teal-500" />
            <span className="text-[11px] font-medium text-slate-500">{getTimePeriodLabel(period, customStart, customEnd, dataRange)}</span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Student Consultation Count (Horizontal Bar)
// ═══════════════════════════════════════════════════════════════════════════
interface FilterOpts {
    seasons: { value: string, label: string }[];
    bloodGroups: { value: string, label: string }[];
    eduLevels: { value: string, label: string }[];
    serviceModes: { value: string, label: string }[];
}

function ConsultationCard({ delay, onClickStudent, opts }: { delay: number; onClickStudent: (id: number) => void; opts: FilterOpts }) {
    const [filters, setFilters] = useState<CardFilters>({ ...DEFAULT_FILTERS });
    const { data, loading, dataRange } = useCardData("consultations", filters);
    const list = data?.consultations ?? [];
    const total = list.reduce((s: number, c: any) => s + c.count, 0);

    return (
        <DataStoryCard
            icon={<Users className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-teal-500 to-emerald-600"
            title="จำนวนครั้งที่นิสิตปรึกษา"
            description="รายชื่อนิสิตในที่ปรึกษาและจำนวนครั้งที่เข้าปรึกษา สีแสดงระดับความเสี่ยงล่าสุด — กดที่แท่งเพื่อดูข้อมูลรายบุคคล"
            narration={data ? `นิสิต ${list.length} คน ปรึกษารวม ${total} ครั้ง — กดที่แท่งเพื่อดูรายละเอียด` : "กำลังโหลด..."}
            kpis={data ? [
                { label: "นิสิตรวม", value: list.length, color: "#14b8a6" },
                { label: "ปรึกษารวม", value: total, color: "#4f46e5" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <StoryChipGroup label="เพศ" options={GENDER_OPTS} selected={filters.gender} onChange={v => setFilters(p => ({ ...p, gender: v }))} />
                    <StoryChipGroup label="ชั้นปี" options={YEAR_OPTS} selected={filters.academicYear} onChange={v => setFilters(p => ({ ...p, academicYear: v }))} />
                    <StoryChipGroup label="รูปแบบ" options={opts.serviceModes} selected={filters.serviceMode} onChange={v => setFilters(p => ({ ...p, serviceMode: v }))} />
                    {opts.seasons.length > 0 && <StoryChipGroup label="ฤดูกาล" options={opts.seasons} selected={filters.seasonIds} onChange={v => setFilters(p => ({ ...p, seasonIds: v }))} />}
                    {opts.bloodGroups.length > 0 && <StoryChipGroup label="กรุ๊ปเลือด" options={opts.bloodGroups} selected={filters.bloodGroup} onChange={v => setFilters(p => ({ ...p, bloodGroup: v }))} />}
                    {opts.eduLevels.length > 0 && <StoryChipGroup label="ระดับการศึกษา" options={opts.eduLevels} selected={filters.educationLevel} onChange={v => setFilters(p => ({ ...p, educationLevel: v }))} />}
                    <StoryChipGroup label="รายได้" options={INCOME_OPTS} selected={filters.incomeBracket} onChange={v => setFilters(p => ({ ...p, incomeBracket: v }))} />
                    <StoryChipGroup label="ครอบครัว" options={FAMILY_OPTS} selected={filters.parentalStatus} onChange={v => setFilters(p => ({ ...p, parentalStatus: v }))} />
                    <TimePeriodChips value={filters.timePeriod} onChange={v => setFilters(p => ({ ...p, timePeriod: v }))}
                        customStart={filters.customStart} customEnd={filters.customEnd}
                        onCustomChange={(s, e) => setFilters(p => ({ ...p, customStart: s, customEnd: e }))} />
                    {isFiltersDirty(filters) && <ResetFilterButton onClick={() => setFilters({ ...DEFAULT_FILTERS })} />}
                </StoryFilterStack>
            }
            headerBadge={<DateRangeBadge period={filters.timePeriod} customStart={filters.customStart} customEnd={filters.customEnd} dataRange={dataRange} />}
            delay={delay} loading={loading}
        >
            {list.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, list.length * 36)}>
                    <BarChart data={list} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#475569" }} />
                        <Tooltip content={<ChartTip />} />
                        <Bar dataKey="count" name="จำนวนครั้ง" radius={[0, 6, 6, 0]}
                            cursor="pointer" onClick={(d: any) => onClickStudent(d.studentId)}>
                            {list.map((e: any, i: number) => (
                                <Cell key={i} fill={e.latestRisk >= 4 ? "#f43f5e" : e.latestRisk >= 3 ? "#f59e0b" : "#14b8a6"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : <div className="h-32 flex items-center justify-center text-slate-300 text-sm">ยังไม่มีข้อมูลการปรึกษา</div>}
        </DataStoryCard>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Booking Trend Timeline
// ═══════════════════════════════════════════════════════════════════════════
function TrendCard({ delay, opts }: { delay: number; opts: FilterOpts }) {
    const [filters, setFilters] = useState<CardFilters>({ ...DEFAULT_FILTERS });
    const { data, loading, dataRange } = useCardData("trend", filters);
    const trend = data?.trend ?? [];
    const chartData = trend.map((t: any) => {
        const [y, m] = t.month.split("-");
        return { month: `${MONTH_LABEL[m] ?? m} ${y}`, จำนวนครั้ง: t.total };
    });

    return (
        <DataStoryCard
            icon={<TrendingUp className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            title="แนวโน้มการรับคำปรึกษา"
            description="กราฟเส้นแสดงจำนวนการปรึกษารายเดือน — ช่วยระบุช่วงเวลาที่นิสิตเครียดสูงสุด เช่น ก่อนสอบ หรือหลังผลออก"
            narration={data ? "ดูช่วงเวลาที่นิสิตเข้ารับคำปรึกษา — ก่อนสอบ / หลังสอบ / ปิดเทอม" : "กำลังโหลด..."}
            kpis={data ? [
                { label: "เดือนทั้งหมด", value: trend.length, color: "#4f46e5" },
                { label: "รวมทั้งหมด", value: chartData.reduce((s: number, c: any) => s + c.จำนวนครั้ง, 0), color: "#10b981" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <StoryChipGroup label="เพศ" options={GENDER_OPTS} selected={filters.gender} onChange={v => setFilters(p => ({ ...p, gender: v }))} />
                    <StoryChipGroup label="ชั้นปี" options={YEAR_OPTS} selected={filters.academicYear} onChange={v => setFilters(p => ({ ...p, academicYear: v }))} />
                    <StoryChipGroup label="รูปแบบ" options={opts.serviceModes} selected={filters.serviceMode} onChange={v => setFilters(p => ({ ...p, serviceMode: v }))} />
                    {opts.seasons.length > 0 && <StoryChipGroup label="ฤดูกาล" options={opts.seasons} selected={filters.seasonIds} onChange={v => setFilters(p => ({ ...p, seasonIds: v }))} />}
                    <TimePeriodChips value={filters.timePeriod} onChange={v => setFilters(p => ({ ...p, timePeriod: v }))}
                        customStart={filters.customStart} customEnd={filters.customEnd}
                        onCustomChange={(s, e) => setFilters(p => ({ ...p, customStart: s, customEnd: e }))} />
                    {isFiltersDirty(filters) && <ResetFilterButton onClick={() => setFilters({ ...DEFAULT_FILTERS })} />}
                </StoryFilterStack>
            }
            headerBadge={<DateRangeBadge period={filters.timePeriod} customStart={filters.customStart} customEnd={filters.customEnd} dataRange={dataRange} />}
            delay={delay} loading={loading}
        >
            {chartData.length > 0 ? (
                <div className="mt-2">
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData} margin={{ left: 0, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94a3b8" }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={35} allowDecimals={false} />
                            <Tooltip content={<ChartTip />} />
                            <Line type="monotone" dataKey="จำนวนครั้ง" stroke="#4f46e5" strokeWidth={2.5}
                                dot={{ r: 3, fill: "#4f46e5" }} activeDot={{ r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : <div className="h-32 flex items-center justify-center text-slate-300 text-sm">ยังไม่มีข้อมูลแนวโน้ม</div>}
        </DataStoryCard>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Student Detail Modal — opens when clicking a bar in the chart
// ═══════════════════════════════════════════════════════════════════════════
function StudentDetailModal({ studentId, onClose }: { studentId: number | null; onClose: () => void }) {
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!studentId) { setStudent(null); return; }
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const res = await fetch(`${API}?section=cards`, { credentials: "include" });
                const json = await res.json();
                if (cancelled) return;
                const found = json.data?.cards?.find((c: any) => c.studentId === studentId);
                setStudent(found ?? null);
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [studentId]);

    if (!studentId) return null;

    const riskBadge = student?.latestRisk > 0 ? RISK_BADGE[student.latestRisk] ?? null : null;
    const initial = student?.name?.charAt(0) ?? "?";
    const formatPhone = (p: string) => {
        const d = p.replace(/\D/g, "");
        if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
        return p;
    };

    // Info rows for clean layout
    const infoRows = student ? [
        { icon: <GraduationCap className="w-4 h-4" />, label: "ชั้นปี", value: student.year ? `ปี ${student.year}` : "-", color: "text-sky-500" },
        { icon: <Users className="w-4 h-4" />, label: "เพศ", value: student.gender ?? "-", color: "text-indigo-500" },
        { icon: <Droplets className="w-4 h-4" />, label: "กรุ๊ปเลือด", value: student.bloodGroup ?? "-", color: "text-rose-500" },
        { icon: <Heart className="w-4 h-4" />, label: "ครอบครัว", value: student.familyStatus ?? "-", color: "text-pink-500" },
        { icon: <CreditCard className="w-4 h-4" />, label: "รายได้ครอบครัว", value: student.income ?? "-", color: "text-amber-500" },
        { icon: <GraduationCap className="w-4 h-4" />, label: "ระดับการศึกษา", value: student.educationLevel ?? "-", color: "text-blue-500" },
    ] : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-[fadeUp_0.25s_ease-out_both] overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* Close button */}
                <button onClick={onClose}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all">
                    <X className="w-5 h-5" />
                </button>

                {loading ? (
                    <div className="p-8">
                        <div className="h-48 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl animate-pulse" />
                    </div>
                ) : student ? (
                    <>
                        {/* Profile header with gradient */}
                        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 px-6 pt-6 pb-5">
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-black shrink-0">
                                    {initial}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-black text-white leading-tight truncate">{student.name}</h2>
                                    {student.nickname && (
                                        <p className="text-sm text-white/70 mt-0.5">({student.nickname})</p>
                                    )}
                                    {riskBadge && (
                                        <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${riskBadge.bg}`}>
                                            {riskBadge.label}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Info list */}
                        <div className="px-6 py-4">
                            <div className="divide-y divide-slate-100">
                                {infoRows.map((row, i) => (
                                    <div key={i} className="flex items-center gap-3 py-2.5">
                                        <div className={`shrink-0 ${row.color}`}>{row.icon}</div>
                                        <span className="text-[12px] text-slate-400 w-[100px] shrink-0">{row.label}</span>
                                        <span className="text-[13px] font-semibold text-slate-700 truncate">{row.value}</span>
                                    </div>
                                ))}

                                {/* Phone row — clickable */}
                                <div className="flex items-center gap-3 py-2.5">
                                    <div className="shrink-0 text-green-500"><Phone className="w-4 h-4" /></div>
                                    <span className="text-[12px] text-slate-400 w-[100px] shrink-0">เบอร์โทร</span>
                                    {student.phone ? (
                                        <a href={`tel:${student.phone}`}
                                            className="text-[13px] font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors">
                                            {formatPhone(student.phone)}
                                        </a>
                                    ) : (
                                        <span className="text-[13px] text-slate-300">ไม่มีข้อมูล</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer — booking count */}
                        <div className="px-6 pb-5">
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100">
                                <span className="text-sm font-semibold text-teal-700">จำนวนครั้งที่ปรึกษา</span>
                                <span className="px-3.5 py-1 rounded-full bg-teal-500 text-white text-base font-black tabular-nums shadow-sm">
                                    {student.totalBookings}
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-8 text-center text-slate-400">ไม่พบข้อมูลนิสิต</div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Problem Donut
// ═══════════════════════════════════════════════════════════════════════════
function ProblemDonutCard({ delay, opts }: { delay: number; opts: FilterOpts }) {
    const [filters, setFilters] = useState<CardFilters>({ ...DEFAULT_FILTERS });
    const { data, loading, dataRange } = useCardData("problems", filters);
    const donut = data?.problems ?? [];
    const donutData = donut.map((d: any, i: number) => ({
        name: d.category, value: d.count, color: PIE_COLORS[i % PIE_COLORS.length],
    }));

    return (
        <DataStoryCard
            icon={<PieIcon className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-violet-500 to-purple-600"
            title="ประเภทปัญหาที่ปรึกษา"
            description="สัดส่วนประเภทปัญหาที่นิสิตในที่ปรึกษานำมาขอรับคำปรึกษา — ใช้เตรียมความพร้อมและเลือกวิธีรับมือที่เหมาะสม"
            narration={data ? `${donut.length} ประเภทปัญหา — สูงสุด: ${donut[0]?.category ?? "-"}` : "กำลังโหลด..."}
            kpis={data ? [
                { label: "ประเภทรวม", value: donut.length, color: "#7c3aed" },
                { label: "ครั้งรวม", value: donut.reduce((s: number, d: any) => s + d.count, 0), color: "#4f46e5" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <StoryChipGroup label="เพศ" options={GENDER_OPTS} selected={filters.gender} onChange={v => setFilters(p => ({ ...p, gender: v }))} />
                    <StoryChipGroup label="ชั้นปี" options={YEAR_OPTS} selected={filters.academicYear} onChange={v => setFilters(p => ({ ...p, academicYear: v }))} />
                    <StoryChipGroup label="รูปแบบ" options={opts.serviceModes} selected={filters.serviceMode} onChange={v => setFilters(p => ({ ...p, serviceMode: v }))} />
                    {opts.seasons.length > 0 && <StoryChipGroup label="ฤดูกาล" options={opts.seasons} selected={filters.seasonIds} onChange={v => setFilters(p => ({ ...p, seasonIds: v }))} />}
                    <TimePeriodChips value={filters.timePeriod} onChange={v => setFilters(p => ({ ...p, timePeriod: v }))}
                        customStart={filters.customStart} customEnd={filters.customEnd}
                        onCustomChange={(s, e) => setFilters(p => ({ ...p, customStart: s, customEnd: e }))} />
                    {isFiltersDirty(filters) && <ResetFilterButton onClick={() => setFilters({ ...DEFAULT_FILTERS })} />}
                </StoryFilterStack>
            }
            headerBadge={<DateRangeBadge period={filters.timePeriod} customStart={filters.customStart} customEnd={filters.customEnd} dataRange={dataRange} />}
            delay={delay} loading={loading}
        >
            {donutData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie data={donutData} dataKey="value" nameKey="name"
                            cx="50%" cy="50%" outerRadius={90} innerRadius={55}
                            paddingAngle={2} strokeWidth={0}>
                            {donutData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<ChartTip />} />
                        <Legend verticalAlign="bottom" iconType="circle"
                            formatter={(v: string) => <span className="text-[10px] text-slate-500 font-medium">{v}</span>} />
                    </PieChart>
                </ResponsiveContainer>
            ) : <div className="h-32 flex items-center justify-center text-slate-300 text-sm">ไม่มีข้อมูล</div>}
        </DataStoryCard>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Comparison Charts
// ═══════════════════════════════════════════════════════════════════════════
function ComparisonCard({ delay, opts }: { delay: number; opts: FilterOpts }) {
    const [filters, setFilters] = useState<CardFilters>({ ...DEFAULT_FILTERS });
    const { data, loading, dataRange } = useCardData("comparison", filters);
    const comparison = data?.comparison ?? { incomeVsCount: [], familyVsCount: [] };

    return (
        <DataStoryCard
            icon={<GitCompareArrows className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-amber-500 to-orange-600"
            title="รายได้ & สถานะครอบครัว vs การปรึกษา"
            description="ความสัมพันธ์ระหว่างระดับรายได้ครอบครัว / สถานะครอบครัว กับจำนวนนิสิตที่เข้าปรึกษา — ช่วยระบุกลุ่มเปราะบางที่ต้องการการดูแลพิเศษ"
            narration={data ? "ความสัมพันธ์ระหว่างรายได้ / ครอบครัว กับจำนวนนิสิตที่มาปรึกษา" : "กำลังโหลด..."}
            filters={
                <StoryFilterStack>
                    <StoryChipGroup label="เพศ" options={GENDER_OPTS} selected={filters.gender} onChange={v => setFilters(p => ({ ...p, gender: v }))} />
                    <StoryChipGroup label="ชั้นปี" options={YEAR_OPTS} selected={filters.academicYear} onChange={v => setFilters(p => ({ ...p, academicYear: v }))} />
                    {opts.seasons.length > 0 && <StoryChipGroup label="ฤดูกาล" options={opts.seasons} selected={filters.seasonIds} onChange={v => setFilters(p => ({ ...p, seasonIds: v }))} />}
                    <TimePeriodChips value={filters.timePeriod} onChange={v => setFilters(p => ({ ...p, timePeriod: v }))}
                        customStart={filters.customStart} customEnd={filters.customEnd}
                        onCustomChange={(s, e) => setFilters(p => ({ ...p, customStart: s, customEnd: e }))} />
                    {isFiltersDirty(filters) && <ResetFilterButton onClick={() => setFilters({ ...DEFAULT_FILTERS })} />}
                </StoryFilterStack>
            }
            headerBadge={<DateRangeBadge period={filters.timePeriod} customStart={filters.customStart} customEnd={filters.customEnd} dataRange={dataRange} />}
            delay={delay} loading={loading}
        >
            <div className="space-y-5 mt-2">
                {/* 5a: Income vs Count */}
                <div>
                    <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> รายได้ครอบครัว vs จำนวนนิสิต
                    </p>
                    {comparison.incomeVsCount.length > 0 ? (
                        <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={comparison.incomeVsCount} margin={{ left: 0, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="incomeRange" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={30} allowDecimals={false} />
                                <Tooltip content={<ChartTip />} />
                                <Line type="monotone" dataKey="studentCount" name="จำนวนนิสิต"
                                    stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <div className="h-16 flex items-center justify-center text-slate-300 text-xs">ไม่มีข้อมูล</div>}
                </div>
                {/* 5b: Family vs Count */}
                <div>
                    <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Heart className="w-3 h-3" /> สถานะครอบครัว vs จำนวนนิสิต
                    </p>
                    {comparison.familyVsCount.length > 0 ? (
                        <ResponsiveContainer width="100%" height={Math.max(120, comparison.familyVsCount.length * 32)}>
                            <BarChart data={comparison.familyVsCount} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                                <YAxis type="category" dataKey="familyStatus" width={110} tick={{ fontSize: 10, fill: "#475569" }} />
                                <Tooltip content={<ChartTip />} />
                                <Bar dataKey="studentCount" name="จำนวนนิสิต" fill="#f97316" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="h-16 flex items-center justify-center text-slate-300 text-xs">ไม่มีข้อมูล</div>}
                </div>
            </div>
        </DataStoryCard>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: High Risk Students
// ═══════════════════════════════════════════════════════════════════════════
function HighRiskCard({ delay, onClickStudent, opts }: { delay: number; onClickStudent: (id: number) => void; opts: FilterOpts }) {
    const [filters, setFilters] = useState<CardFilters>({ ...DEFAULT_FILTERS });
    const { data, loading, dataRange } = useCardData("highrisk", filters);
    const highRisk = data?.highrisk ?? [];

    // Map risk data for bar chart
    const chartData = highRisk.map((s: any) => ({
        name: s.name, riskLevel: s.riskLevel, studentId: s.studentId,
        problemCategory: s.problemCategory ?? "ไม่ระบุ",
    }));

    return (
        <DataStoryCard
            icon={<ShieldAlert className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-rose-500 to-pink-600"
            title="นิสิตเฝ้าระวังพิเศษ"
            description="รายชื่อนิสิตที่ได้รับการประเมินความเสี่ยงระดับสูงหรือวิกฤต — กดที่แท่งเพื่อดูข้อมูลรายบุคคลและประสานการดูแลเชิงรุก"
            narration={data ? `นิสิตที่ได้ความเสี่ยงระดับ สูง/วิกฤต — ${highRisk.length} คน — กดที่แท่งเพื่อดูรายละเอียด` : "กำลังโหลด..."}
            kpis={data ? [{ label: "เฝ้าระวัง", value: highRisk.length, color: "#f43f5e" }] : undefined}
            filters={
                <StoryFilterStack>
                    <StoryChipGroup label="เพศ" options={GENDER_OPTS} selected={filters.gender} onChange={v => setFilters(p => ({ ...p, gender: v }))} />
                    <StoryChipGroup label="ชั้นปี" options={YEAR_OPTS} selected={filters.academicYear} onChange={v => setFilters(p => ({ ...p, academicYear: v }))} />
                    <StoryChipGroup label="รูปแบบ" options={opts.serviceModes} selected={filters.serviceMode} onChange={v => setFilters(p => ({ ...p, serviceMode: v }))} />
                    {opts.seasons.length > 0 && <StoryChipGroup label="ฤดูกาล" options={opts.seasons} selected={filters.seasonIds} onChange={v => setFilters(p => ({ ...p, seasonIds: v }))} />}
                    {opts.bloodGroups.length > 0 && <StoryChipGroup label="กรุ๊ปเลือด" options={opts.bloodGroups} selected={filters.bloodGroup} onChange={v => setFilters(p => ({ ...p, bloodGroup: v }))} />}
                    <TimePeriodChips value={filters.timePeriod} onChange={v => setFilters(p => ({ ...p, timePeriod: v }))}
                        customStart={filters.customStart} customEnd={filters.customEnd}
                        onCustomChange={(s, e) => setFilters(p => ({ ...p, customStart: s, customEnd: e }))} />
                    {isFiltersDirty(filters) && <ResetFilterButton onClick={() => setFilters({ ...DEFAULT_FILTERS })} />}
                </StoryFilterStack>
            }
            headerBadge={<DateRangeBadge period={filters.timePeriod} customStart={filters.customStart} customEnd={filters.customEnd} dataRange={dataRange} />}
            delay={delay} loading={loading}
        >
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 5]}
                            tickFormatter={(v: number) => {
                                const labels: Record<number, string> = { 1: "ปกติ", 2: "ต่ำ", 3: "ปานกลาง", 4: "สูง", 5: "วิกฤต" };
                                return labels[v] ?? String(v);
                            }} />
                        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#475569" }} />
                        <Tooltip content={({ active, payload }: any) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            const riskLabels: Record<number, string> = { 1: "ปกติ", 2: "ต่ำ", 3: "ปานกลาง", 4: "สูง", 5: "วิกฤต" };
                            return (
                                <div className="bg-slate-900/95 backdrop-blur rounded-xl shadow-2xl px-4 py-2.5 text-xs border border-white/10 z-50">
                                    <p className="font-bold text-white/70 mb-1">{d.name}</p>
                                    <p className="text-white">ระดับความเสี่ยง: <span className="font-bold text-rose-400">{riskLabels[d.riskLevel] ?? d.riskLevel}</span></p>
                                    <p className="text-white/60 mt-0.5">ปัญหา: {d.problemCategory}</p>
                                </div>
                            );
                        }} />
                        <Bar dataKey="riskLevel" name="ระดับความเสี่ยง" radius={[0, 6, 6, 0]}
                            cursor="pointer" onClick={(d: any) => onClickStudent(d.studentId)}>
                            {chartData.map((e: any, i: number) => (
                                <Cell key={i} fill={e.riskLevel >= 5 ? "#dc2626" : "#f43f5e"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-24 flex items-center justify-center text-emerald-400 text-sm font-medium mt-2">
                    <CheckCircle className="w-4 h-4 mr-1.5" />ไม่พบนิสิตที่มีระดับความเสี่ยงสูง
                </div>
            )}
        </DataStoryCard>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Income Distribution (uses comparison → incomeVsCount)
// ═══════════════════════════════════════════════════════════════════════════
const INCOME_LABEL_ADV: Record<string, string> = {
    "UNDER_100K": "< 100K", "BETWEEN_100K_200K": "100-200K",
    "BETWEEN_200K_300K": "200-300K", "BETWEEN_300K_500K": "300-500K",
    "BETWEEN_500K_800K": "500-800K", "BETWEEN_800K_1M": "800K-1M",
    "OVER_1M": "> 1M", "UNKNOWN": "ไม่ทราบ",
};
const INCOME_COLORS_ADV = ["#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#f59e0b", "#f97316", "#ef4444", "#94a3b8"];
const INCOME_ORDER_ADV = ["UNDER_100K", "BETWEEN_100K_200K", "BETWEEN_200K_300K", "BETWEEN_300K_500K", "BETWEEN_500K_800K", "BETWEEN_800K_1M", "OVER_1M", "UNKNOWN"];

// Parental status colors keyed by Thai label (API returns Thai names for advisor)
const PARENTAL_COLORS_ADV: Record<string, string> = {
    "อยู่ด้วยกัน": "#10b981",
    "หย่าร้าง": "#f59e0b",
    "เลี้ยงเดี่ยว": "#3b82f6",
    "บิดาเสียชีวิต": "#f97316",
    "มารดาเสียชีวิต": "#8b5cf6",
    "เสียชีวิตทั้งคู่": "#ef4444",
    "ไม่ระบุ": "#94a3b8",
};

function AdvisorIncomeCard({ delay, opts }: { delay: number; opts: FilterOpts }) {
    const [filters, setFilters] = useState<CardFilters>({ ...DEFAULT_FILTERS });
    const { data, loading, dataRange } = useCardData("comparison", filters);
    const rawIncome: { incomeRange: string; code?: string; studentCount: number }[] = data?.comparison?.incomeVsCount ?? [];
    const total = rawIncome.reduce((s, d) => s + d.studentCount, 0);

    // Sort by income order low→high — match on code field (API returns both incomeRange label + code)
    const sorted = INCOME_ORDER_ADV
        .map(key => rawIncome.find(d => d.code === key || d.incomeRange === key))
        .filter(Boolean)
        .map(d => ({
            key: d!.code ?? d!.incomeRange,
            name: INCOME_LABEL_ADV[d!.code ?? ""] ?? INCOME_LABEL_ADV[d!.incomeRange] ?? d!.incomeRange,
            count: d!.studentCount,
            pct: total > 0 ? parseFloat((d!.studentCount / total * 100).toFixed(1)) : 0,
        }))
        .filter(d => d.count > 0);

    // Parental status — familyVsCount has Thai labels already
    const rawParental: { familyStatus: string; studentCount: number }[] = data?.comparison?.familyVsCount ?? [];
    const parentalTotal = rawParental.reduce((s, d) => s + d.studentCount, 0);
    const sortedParental = [...rawParental]
        .sort((a, b) => b.studentCount - a.studentCount)
        .map(d => ({
            name: d.familyStatus,
            count: d.studentCount,
            color: PARENTAL_COLORS_ADV[d.familyStatus] ?? PIE_COLORS[0],
            pct: parentalTotal > 0 ? parseFloat((d.studentCount / parentalTotal * 100).toFixed(1)) : 0,
        }))
        .filter(d => d.count > 0);

    const topGroup = [...sorted].sort((a, b) => b.count - a.count)[0];
    const lowPct = sorted.filter(d => ["UNDER_100K", "BETWEEN_100K_200K", "BETWEEN_200K_300K"].includes(d.key))
        .reduce((s, d) => s + d.pct, 0);
    const narration = topGroup
        ? `กลุ่มรายได้ที่พบมากที่สุดคือ "${topGroup.name}" (${topGroup.pct}%) — นิสิตรายได้ต่ำ <300K/ปี รวม ${lowPct.toFixed(1)}%`
        : "กำลังโหลด...";

    return (
        <DataStoryCard
            icon={<Wallet className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            title="รายได้ครอบครัวนิสิตในที่ปรึกษา"
            description="การกระจายระดับรายได้ครอบครัวต่อปีของนิสิตในที่ปรึกษา — ใช้วางแผนการดูแลและสนับสนุนนิสิตกลุ่มเปราะบางทางการเงิน"
            narration={loading ? "กำลังโหลด..." : narration}
            kpis={data && total > 0 ? [
                { label: "นิสิตในฐานข้อมูล", value: total, color: "#10b981" },
                { label: "กลุ่มรายได้", value: sorted.length, color: "#6366f1" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <StoryChipGroup label="เพศ" options={GENDER_OPTS} selected={filters.gender} onChange={v => setFilters(p => ({ ...p, gender: v }))} />
                    <StoryChipGroup label="ชั้นปี" options={YEAR_OPTS} selected={filters.academicYear} onChange={v => setFilters(p => ({ ...p, academicYear: v }))} />
                    {opts.seasons.length > 0 && <StoryChipGroup label="ฤดูกาล" options={opts.seasons} selected={filters.seasonIds} onChange={v => setFilters(p => ({ ...p, seasonIds: v }))} />}
                    <TimePeriodChips value={filters.timePeriod} onChange={v => setFilters(p => ({ ...p, timePeriod: v }))}
                        customStart={filters.customStart} customEnd={filters.customEnd}
                        onCustomChange={(s, e) => setFilters(p => ({ ...p, customStart: s, customEnd: e }))} />
                    {isFiltersDirty(filters) && <ResetFilterButton onClick={() => setFilters({ ...DEFAULT_FILTERS })} />}
                </StoryFilterStack>
            }
            headerBadge={<DateRangeBadge period={filters.timePeriod} customStart={filters.customStart} customEnd={filters.customEnd} dataRange={dataRange} />}
            delay={delay} loading={loading}
        >
            <div className="space-y-5">
                {sorted.length > 0 ? (
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">รายได้ครอบครัวต่อปี (บาท)</p>
                        <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 36 + 40)}>
                            <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 16, top: 4, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip content={({ active, payload }: any) => {
                                    if (!active || !payload?.[0]) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xl text-xs min-w-[160px]">
                                            <p className="font-bold text-slate-800 mb-2">{d.name}</p>
                                            <div className="flex justify-between gap-4"><span className="text-slate-400">จำนวน:</span><span className="font-bold text-slate-700">{d.count} ราย</span></div>
                                            <div className="flex justify-between gap-4"><span className="text-slate-400">สัดส่วน:</span><span className="font-bold text-emerald-600">{d.pct}%</span></div>
                                        </div>
                                    );
                                }} />
                                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={22}>
                                    {sorted.map((d, idx) => (
                                        <Cell key={idx} fill={INCOME_COLORS_ADV[INCOME_ORDER_ADV.indexOf(d.key)] ?? PIE_COLORS[idx % PIE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                            {sorted.map((d, i) => {
                                const colorIdx = INCOME_ORDER_ADV.indexOf(d.key);
                                const color = INCOME_COLORS_ADV[colorIdx] ?? PIE_COLORS[i % PIE_COLORS.length];
                                return (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                        <span className="text-[11px] text-slate-600 flex-1 truncate">{d.name}</span>
                                        <span className="text-[11px] font-bold text-slate-500 tabular-nums">{d.pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                        <Wallet className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-sm font-medium">ยังไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
                    </div>
                )}

                {/* ── Parental Status Section ── */}
                {sortedParental.length > 0 && (
                    <div className="pt-5 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สถานะบิดามารดา</p>
                            <span className="text-[10px] text-slate-300">({parentalTotal.toLocaleString()} ราย)</span>
                        </div>
                        <ResponsiveContainer width="100%" height={Math.max(150, sortedParental.length * 32 + 20)}>
                            <BarChart data={sortedParental} layout="vertical" margin={{ left: 10, right: 16, top: 2, bottom: 2 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip content={({ active, payload }: any) => {
                                    if (!active || !payload?.[0]) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xl text-xs min-w-[160px]">
                                            <p className="font-bold text-slate-800 mb-2">{d.name}</p>
                                            <div className="flex justify-between gap-4"><span className="text-slate-400">จำนวน:</span><span className="font-bold text-slate-700">{d.count} ราย</span></div>
                                            <div className="flex justify-between gap-4"><span className="text-slate-400">สัดส่วน:</span><span className="font-bold text-indigo-600">{d.pct}%</span></div>
                                        </div>
                                    );
                                }} />
                                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={18}>
                                    {sortedParental.map((d, idx) => <Cell key={idx} fill={d.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                            {sortedParental.map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                    <span className="text-[11px] text-slate-600 flex-1 truncate">{d.name}</span>
                                    <span className="text-[11px] font-bold text-slate-500 tabular-nums">{d.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DataStoryCard>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export function AdvisorDashboard() {
    const [advisor, setAdvisor] = useState<{ name: string } | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [opts, setOpts] = useState<FilterOpts>({ seasons: [], bloodGroups: [], eduLevels: [], serviceModes: [] });

    // Load advisor name once
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}?section=consultations&include_categories=true`, { credentials: "include" });
                const json = await res.json();
                if (json.data?.advisor) setAdvisor(json.data.advisor);
                if (json.data) {
                    setOpts({
                        seasons: json.data.seasons?.map((s: any) => ({ value: String(s.id), label: s.name })) || [],
                        bloodGroups: json.data.bloodGroups || [],
                        eduLevels: json.data.educationLevels || [],
                        serviceModes: json.data.serviceModes || [],
                    });
                }
            } catch { /* silent */ }
        })();
    }, []);

    return (
        <div className="min-h-screen">
            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>

            <div className="space-y-5">
                {/* Header */}
                <div className="animate-[fadeUp_0.5s_ease-out_both]">
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-2 h-9 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
                        <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            แผงควบคุมอาจารย์ที่ปรึกษา
                        </h1>
                    </div>
                    {advisor && (
                        <p className="text-sm text-slate-400 ml-4">
                            <span className="font-semibold text-teal-600">{advisor.name}</span> — นิสิตในที่ปรึกษา
                        </p>
                    )}
                </div>

                <ConsultationCard delay={0} onClickStudent={setSelectedStudentId} opts={opts} />
                <TrendCard delay={1} opts={opts} />

                <DataStoryGrid cols={2}>
                    <ProblemDonutCard delay={2} opts={opts} />
                    <ComparisonCard delay={3} opts={opts} />
                </DataStoryGrid>

                <AdvisorIncomeCard delay={4} opts={opts} />

                <HighRiskCard delay={5} onClickStudent={setSelectedStudentId} opts={opts} />

                <div className="text-center text-xs text-slate-300 py-3 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "500ms" }}>
                    อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                </div>
            </div>

            {/* Student Detail Modal */}
            <StudentDetailModal studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} />
        </div>
    );
}
