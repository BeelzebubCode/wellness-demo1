// src/features/dashboard/dean/components/sections/DepartmentConsultationChart.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, Legend,
} from "recharts";
import { useRouter } from "next/navigation";
import { Building2, BarChart3, Calendar, Loader2, X, ArrowRight } from "lucide-react";
import { DataStoryCard } from "../../../widgets/story/DataStoryCard";
import { StoryFilterStack } from "../../../widgets/story/StoryFilterChips";
import { DatePresetBar } from "../../../shared/StoryUI";
import { getDateRange, type DatePreset, type DateRange } from "../../../shared/story-utils";

// ── Colors ──────────────────────────────────────────────────────────────
const DEPT_COLORS = [
    "#6366f1", "#8b5cf6", "#a78bfa", "#c084fc",
    "#e879f9", "#f472b6", "#fb7185", "#f97316",
    "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
];

const PERIOD_COLORS: Record<string, string> = {
    MIDTERM_EXAM: "#f59e0b",
    FINAL_EXAM:   "#ef4444",
};

const PERIOD_CHIP_STYLES: Record<string, { bg: string; text: string; activeBg: string }> = {
    MIDTERM_EXAM: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", activeBg: "bg-amber-500 text-white border-amber-500" },
    FINAL_EXAM:   { bg: "bg-rose-50 border-rose-200",   text: "text-rose-700",  activeBg: "bg-rose-500 text-white border-rose-500" },
};

// ── Types ───────────────────────────────────────────────────────────────
interface DeptBooking {
    id: number;
    nameTh: string;
    code: string;
    count: number;
}

interface AcademicPeriod {
    periodId: number;
    nameTh: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;
    termYear: number;
    termNameTh: string;
    termCode: string;
    periodTypeCode: string;
    periodTypeName: string;
    isActiveTerm: boolean;
}

type ViewMode = "single" | "compare";

const API = "/api/v2/dashboards/dean/story";
const PERIODS_API = "/api/v2/dashboards/dean/academic-periods";

// ── helpers ─────────────────────────────────────────────────────────────
function fmtDateTH(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function periodLabel(p: AcademicPeriod): string {
    const typeEmoji = p.periodTypeCode === "MIDTERM_EXAM" ? "📝" : "📋";
    return `${typeEmoji} ${p.periodTypeName} ${p.termNameTh}`;
}

function periodSubLabel(p: AcademicPeriod): string {
    return `${fmtDateTH(p.startDate)} – ${fmtDateTH(p.endDate)}`;
}

// ─────────────────────────────────────────────────────────────────────────
export default function DepartmentConsultationChart() {
    const router = useRouter();

    // ── filter state ────────────────────────────────────────────────────
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [dataRange, setDataRange] = useState<{ minDate: string; maxDate: string } | null>(null);

    // ── data state ──────────────────────────────────────────────────────
    const [deptData, setDeptData] = useState<DeptBooking[]>([]);
    const [loading, setLoading] = useState(true);

    // ── academic periods ────────────────────────────────────────────────
    const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
    const [periodsLoading, setPeriodsLoading] = useState(true);
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

    // ── view mode ───────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<ViewMode>("single");
    const [compareData, setCompareData] = useState<Record<number, DeptBooking[]>>({});
    const [compareLoading, setCompareLoading] = useState(false);

    // guards
    const fetchGuardRef = useRef(0);

    // ── Load academic periods ───────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(PERIODS_API, { credentials: "include", cache: "no-store" });
                const json = await res.json();
                if (cancelled) return;
                setPeriods(json.data?.periods ?? []);
            } catch { /* silent */ } finally {
                if (!cancelled) setPeriodsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // ── Fetch departments for single view ───────────────────────────────
    const fetchDepts = useCallback(async (
        datePreset: DatePreset,
        cRange: DateRange | undefined,
        periodOverride?: { start: string; end: string },
    ) => {
        const id = ++fetchGuardRef.current;
        setLoading(true);
        try {
            const sp = new URLSearchParams({ story: "departments" });
            if (periodOverride) {
                sp.set("date_start", periodOverride.start);
                sp.set("date_end",   periodOverride.end);
            } else {
                const dr = getDateRange(datePreset, cRange);
                if (dr.allTime) sp.set("all_time", "true");
                else {
                    if (dr.start) sp.set("date_start", dr.start);
                    if (dr.end)   sp.set("date_end",   dr.end);
                }
            }
            const res = await fetch(`${API}?${sp}`, { credentials: "include", cache: "no-store" });
            const json = await res.json();
            if (fetchGuardRef.current !== id) return;
            setDeptData(json.data?.departmentBookings ?? []);
            if (json.data?.dataRange) setDataRange(json.data.dataRange);
        } catch { /* silent */ } finally {
            if (fetchGuardRef.current === id) setLoading(false);
        }
    }, []);

    // ── Effect: reload on filter change ─────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedPeriodId) {
                const p = periods.find(x => x.periodId === selectedPeriodId);
                if (p) fetchDepts("custom", undefined, { start: p.startDate, end: p.endDate });
            } else {
                fetchDepts(date, customRange);
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [date, customRange, selectedPeriodId, periods, fetchDepts]);

    // ── Compare mode: fetch all periods in parallel ─────────────────────
    useEffect(() => {
        if (viewMode !== "compare" || periods.length === 0) return;
        let cancelled = false;
        setCompareLoading(true);
        (async () => {
            const results: Record<number, DeptBooking[]> = {};
            await Promise.all(
                periods.map(async (p) => {
                    const sp = new URLSearchParams({
                        story: "departments",
                        date_start: p.startDate,
                        date_end: p.endDate,
                    });
                    try {
                        const res = await fetch(`${API}?${sp}`, { credentials: "include", cache: "no-store" });
                        const json = await res.json();
                        if (!cancelled) results[p.periodId] = json.data?.departmentBookings ?? [];
                    } catch { /* silent */ }
                })
            );
            if (!cancelled) {
                setCompareData(results);
                setCompareLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [viewMode, periods]);

    // ── derived ─────────────────────────────────────────────────────────
    const sorted = useMemo(
        () => [...deptData].filter(d => d.count > 0).sort((a, b) => b.count - a.count),
        [deptData],
    );
    const maxCount = sorted.length > 0 ? Math.max(...sorted.map(d => d.count)) : 1;
    const totalCount = sorted.reduce((sum, d) => sum + d.count, 0);

    // selected period info
    const selectedPeriod = selectedPeriodId ? periods.find(p => p.periodId === selectedPeriodId) : null;

    // ── handlers ────────────────────────────────────────────────────────
    const handleClick = (entry: DeptBooking) => {
        router.push(`/dean/subject-group?dept=${entry.id}`);
    };

    const handlePeriodSelect = (periodId: number) => {
        if (selectedPeriodId === periodId) {
            // deselect
            setSelectedPeriodId(null);
            setDate("all");
        } else {
            setSelectedPeriodId(periodId);
            setDate("custom"); // switch to custom so DatePresetBar doesn't override
        }
    };

    // ── narration text ──────────────────────────────────────────────────
    const narration = loading
        ? "กำลังโหลด..."
        : selectedPeriod
            ? `ช่วง${selectedPeriod.periodTypeName} ${selectedPeriod.termNameTh} (${fmtDateTH(selectedPeriod.startDate)} – ${fmtDateTH(selectedPeriod.endDate)}) มีการใช้บริการ ${totalCount.toLocaleString()} ครั้ง จาก ${sorted.length} สาขา`
            : `มีการใช้บริการทั้งหมด ${totalCount.toLocaleString()} ครั้ง จาก ${sorted.length} สาขา — สามารถคลิกที่แท่งกราฟเพื่อเจาะดูรายละเอียดของสาขานั้นได้`;

    // ── compare data processing ─────────────────────────────────────────
    const compareChartData = useMemo(() => {
        if (viewMode !== "compare" || periods.length === 0) return [];

        // Collect all department names
        const allDepts = new Map<number, string>();
        Object.values(compareData).forEach(bookings =>
            bookings.forEach(b => allDepts.set(b.id, b.nameTh))
        );

        // Build chart data: [ { deptName, period1_count, period2_count, ... } ]
        return Array.from(allDepts.entries()).map(([deptId, deptName]) => {
            const row: Record<string, any> = { deptId, deptName };
            let total = 0;
            periods.forEach(p => {
                const bookings = compareData[p.periodId] ?? [];
                const found = bookings.find(b => b.id === deptId);
                const count = found?.count ?? 0;
                row[`p_${p.periodId}`] = count;
                total += count;
            });
            row.total = total;
            return row;
        }).sort((a, b) => b.total - a.total);
    }, [viewMode, compareData, periods]);

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <DataStoryCard
            icon={<Building2 className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-indigo-500 to-violet-600"
            title="จำนวนการเข้าใช้บริการ แยกตามสาขา"
            description="ดูสัดส่วนการมาใช้บริการแยกตามภาควิชา เพื่อช่วยจัดสรรทรัพยากร ประเมินความต้องการ และพิจารณาปรับรอบคิวของนักจิตวิทยาให้เหมาะสมกับความต้องการของแต่ละสาขา"
            narration={narration}
            datePreset={selectedPeriodId ? undefined : date}
            customRange={selectedPeriod ? { start: selectedPeriod.startDate, end: selectedPeriod.endDate } : customRange}
            filters={
                <StoryFilterStack>
                    {/* date presets */}
                    <DatePresetBar
                        value={selectedPeriodId ? "custom" : date}
                        onChange={(v) => { setSelectedPeriodId(null); setDate(v); }}
                        customRange={customRange}
                        onCustomRangeChange={setCustomRange}
                        dataRange={dataRange}
                    />

                    {/* exam period chips */}
                    {periods.length > 0 && (
                        <div className="mt-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                🎯 ช่วงสอบ
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {periods.map(p => {
                                    const isActive = selectedPeriodId === p.periodId;
                                    const styles = PERIOD_CHIP_STYLES[p.periodTypeCode] ?? PERIOD_CHIP_STYLES.MIDTERM_EXAM;
                                    return (
                                        <button
                                            key={p.periodId}
                                            onClick={() => handlePeriodSelect(p.periodId)}
                                            title={`${p.nameTh}\n${p.startDate} – ${p.endDate}`}
                                            className={`
                                                px-2.5 py-1 rounded-full text-[10px] font-bold border
                                                transition-all duration-200
                                                ${isActive
                                                    ? styles.activeBg
                                                    : `${styles.bg} ${styles.text} hover:opacity-80`
                                                }
                                            `}
                                        >
                                            {p.periodTypeName} {p.termNameTh}
                                            <span className="ml-1 opacity-70 text-[9px]">
                                                ({fmtDateTH(p.startDate)}–{fmtDateTH(p.endDate)})
                                            </span>
                                            {isActive && <X className="w-3 h-3 inline-block ml-1 -mt-0.5" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {periodsLoading && (
                        <div className="flex items-center gap-1.5 mt-2 text-slate-400 text-[10px]">
                            <Loader2 className="w-3 h-3 animate-spin" /> กำลังโหลดช่วงสอบ...
                        </div>
                    )}

                    {/* compare toggle */}
                    {periods.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                            <button
                                onClick={() => setViewMode(viewMode === "compare" ? "single" : "compare")}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold
                                    transition-all duration-200 border
                                    ${viewMode === "compare"
                                        ? "bg-violet-500 text-white border-violet-500"
                                        : "text-violet-600 border-violet-200 bg-violet-50 hover:bg-violet-100"
                                    }
                                `}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                เปรียบเทียบช่วงสอบ
                            </button>
                        </div>
                    )}
                </StoryFilterStack>
            }
            delay={0}
            loading={loading && viewMode === "single"}
            className="w-full"
        >
            {viewMode === "compare" ? (
                /* ────── Compare View ────── */
                compareLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                        <span className="text-xs text-slate-400">กำลังโหลดข้อมูลเปรียบเทียบ...</span>
                    </div>
                ) : compareChartData.length > 0 ? (
                    <div className="pt-2 space-y-6">
                        {/* Grouped Bar Chart */}
                        <ResponsiveContainer width="100%" height={Math.max(compareChartData.length * 56, 300)}>
                            <BarChart
                                data={compareChartData}
                                layout="vertical"
                                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                                    tickFormatter={(v) => v.toLocaleString()}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="deptName"
                                    width={160}
                                    tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                                />
                                <Tooltip
                                    cursor={{ fill: "#f8fafc" }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const row = payload[0]?.payload;
                                        return (
                                            <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xl text-xs max-w-xs">
                                                <p className="font-bold text-slate-700 mb-1.5">{row?.deptName}</p>
                                                {payload.map((entry: any) => {
                                                    const p = periods.find(x => `p_${x.periodId}` === entry.dataKey);
                                                    if (!p) return null;
                                                    return (
                                                        <div key={entry.dataKey} className="flex items-center gap-1.5 mb-0.5">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                                                            <span className="text-slate-500">
                                                                {p.periodTypeName} {p.termNameTh}:
                                                            </span>
                                                            <span className="font-bold" style={{ color: entry.fill }}>
                                                                {(entry.value as number).toLocaleString()} ครั้ง
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                <div className="mt-1 pt-1 border-t border-slate-100">
                                                    <span className="text-slate-400">รวม: </span>
                                                    <span className="font-bold text-slate-700">{row?.total?.toLocaleString()} ครั้ง</span>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    height={40}
                                    content={() => (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {periods.map((p, idx) => (
                                                <div key={p.periodId} className="flex items-center gap-1">
                                                    <div
                                                        className="w-3 h-3 rounded-sm"
                                                        style={{ backgroundColor: getPeriodBarColor(p.periodTypeCode, idx) }}
                                                    />
                                                    <span className="text-[10px] text-slate-500">
                                                        {p.periodTypeName} {p.termNameTh}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                                {periods.map((p, idx) => (
                                    <Bar
                                        key={p.periodId}
                                        dataKey={`p_${p.periodId}`}
                                        fill={getPeriodBarColor(p.periodTypeCode, idx)}
                                        radius={[0, 4, 4, 0]}
                                        barSize={10}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>

                        {/* Ranking Table */}
                        <div className="bg-slate-50 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                🏆 อันดับสาขาที่มาปรึกษามากสุดในแต่ละช่วงสอบ
                            </h4>
                            <div className="grid gap-2">
                                {periods.map(p => {
                                    const bookings = compareData[p.periodId] ?? [];
                                    const topDept = [...bookings].sort((a, b) => b.count - a.count)[0];
                                    const totalInPeriod = bookings.reduce((s, b) => s + b.count, 0);
                                    const styles = PERIOD_CHIP_STYLES[p.periodTypeCode] ?? PERIOD_CHIP_STYLES.MIDTERM_EXAM;
                                    return (
                                        <div key={p.periodId} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-slate-100">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${styles.bg} ${styles.text} shrink-0`}>
                                                {p.periodTypeName} {p.termNameTh}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                                            {topDept ? (
                                                <span className="text-xs text-slate-600">
                                                    <span className="font-bold text-slate-800">{topDept.nameTh}</span>
                                                    {" "}({topDept.count.toLocaleString()} ครั้ง)
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">ไม่มีข้อมูล</span>
                                            )}
                                            <span className="ml-auto text-[10px] text-slate-400">
                                                รวม {totalInPeriod.toLocaleString()} ครั้ง
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                        ยังไม่มีข้อมูลสำหรับเปรียบเทียบ
                    </div>
                )
            ) : (
                /* ────── Single View ────── */
                sorted.length > 0 ? (
                    <div className="pt-2">
                        <ResponsiveContainer width="100%" height={Math.max(sorted.length * 48, 200)}>
                            <BarChart
                                data={sorted}
                                layout="vertical"
                                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    domain={[0, Math.ceil(maxCount * 1.15)]}
                                    tickFormatter={(v) => v.toLocaleString()}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="nameTh"
                                    width={180}
                                    tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
                                />
                                <Tooltip
                                    cursor={{ fill: "#f8fafc" }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.[0]) return null;
                                        const d = payload[0].payload as DeptBooking;
                                        return (
                                            <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xl text-xs">
                                                <p className="font-bold text-slate-700 mb-1">{d.nameTh}</p>
                                                <p className="text-slate-500">
                                                    ปรึกษา <span className="font-bold text-indigo-600">{d.count.toLocaleString()}</span> ครั้ง
                                                </p>
                                                {selectedPeriod && (
                                                    <p className="text-[9px] text-slate-400 mt-1">
                                                        ช่วง{selectedPeriod.periodTypeName} {selectedPeriod.termNameTh}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-slate-400 mt-1 italic">คลิกเพื่อดูรายละเอียดเชิงลึก</p>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[0, 8, 8, 0]}
                                    cursor="pointer"
                                    onClick={(_: any, idx: number) => handleClick(sorted[idx])}
                                >
                                    {sorted.map((_, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={selectedPeriod
                                                ? PERIOD_COLORS[selectedPeriod.periodTypeCode] ?? DEPT_COLORS[idx % DEPT_COLORS.length]
                                                : DEPT_COLORS[idx % DEPT_COLORS.length]
                                            }
                                            className="transition-opacity hover:opacity-80"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                        {!loading && "ยังไม่มีข้อมูล"}
                    </div>
                )
            )}
        </DataStoryCard>
    );
}

// ── Bar color helper ────────────────────────────────────────────────────
// Midterm chips use amber shades, Final chips use rose/red shades
function getPeriodBarColor(typeCode: string, idx: number): string {
    const midtermColors = ["#f59e0b", "#fbbf24", "#d97706", "#f59e0b", "#fbbf24"];
    const finalColors   = ["#ef4444", "#f87171", "#dc2626", "#ef4444", "#f87171"];
    if (typeCode === "MIDTERM_EXAM") return midtermColors[idx % midtermColors.length];
    if (typeCode === "FINAL_EXAM")   return finalColors[idx % finalColors.length];
    return DEPT_COLORS[idx % DEPT_COLORS.length];
}
