"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Polyline, Popup, CircleMarker } from "react-leaflet";
import { ArrowRightLeft, TrendingUp, Building2, AlertCircle, Calendar, Sun, CloudRain, Snowflake, BookOpen } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface BorrowPair {
    from_id: number; from_code: string; from_name: string; from_lat: number; from_lng: number;
    to_id: number; to_code: string; to_name: string; to_lat: number; to_lng: number;
    borrow_count: number; problems: string;
}

interface TopBorrower {
    uni_id: number; code: string; name: string; lat: number; lng: number; total_borrowed: number;
    topDestinations: { code: string; name: string; lat: number; lng: number; count: number }[];
}

interface SeasonInfo { season_id: number; season_code: string; season_name_th: string; month_start: number; month_end: number; }
interface TermTypeInfo { id: number; code: string; name_th: string; }

export interface BorrowAnalytics {
    summary: { total_requests: number; total_assigned: number; total_completed: number };
    universityPairs: BorrowPair[];
    topBorrowers: TopBorrower[];
    problemBreakdown: { problem: string; count: number; percentage: number }[];
    filters?: { seasons: SeasonInfo[]; termTypes: TermTypeInfo[]; academicYears: number[] };
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useBorrowAnalytics(dateFrom?: string, dateTo?: string) {
    const [data, setData] = useState<BorrowAnalytics | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);
        const qs = params.toString();
        fetch(`/api/v2/dashboards/ministry/borrow-analytics${qs ? `?${qs}` : ""}`)
            .then((r) => r.json())
            .then((d) => setData(d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [dateFrom, dateTo]);

    return { data, loading };
}

// ─── Season / Term helpers ────────────────────────────────────────────────

const THAI_MONTHS: Record<number, string> = {
    1: "ม.ค.", 2: "ก.พ.", 3: "มี.ค.", 4: "เม.ย.", 5: "พ.ค.", 6: "มิ.ย.",
    7: "ก.ค.", 8: "ส.ค.", 9: "ก.ย.", 10: "ต.ค.", 11: "พ.ย.", 12: "ธ.ค.",
};

const SEASON_ICONS: Record<string, React.ReactNode> = {
    HOT: <Sun className="w-3 h-3 text-orange-500" />,
    RAIN: <CloudRain className="w-3 h-3 text-blue-500" />,
    COOL: <Snowflake className="w-3 h-3 text-cyan-500" />,
};
const SEASON_COLORS: Record<string, string> = {
    HOT: "from-orange-500 to-amber-400",
    RAIN: "from-blue-500 to-sky-400",
    COOL: "from-cyan-500 to-teal-400",
};

/** Convert season month range + year to ISO from/to dates */
function seasonToDateRange(monthStart: number, monthEnd: number, year: number): { from: string; to: string } {
    // Thai academic year: e.g. 2568 → CE 2025/2026
    const ceYear = year - 543;
    if (monthEnd >= monthStart) {
        // same calendar year
        return {
            from: new Date(ceYear, monthStart - 1, 1).toISOString(),
            to: new Date(ceYear, monthEnd, 0, 23, 59, 59).toISOString(),
        };
    }
    // wraps around year (e.g. Nov→Feb)
    return {
        from: new Date(ceYear, monthStart - 1, 1).toISOString(),
        to: new Date(ceYear + 1, monthEnd, 0, 23, 59, 59).toISOString(),
    };
}

/** Convert term type to approximate date range */
function termToDateRange(termCode: string, year: number): { from: string; to: string } {
    const ceYear = year - 543;
    switch (termCode) {
        case "SEMESTER_1": // ~Jun-Oct
            return { from: new Date(ceYear, 5, 1).toISOString(), to: new Date(ceYear, 9, 31, 23, 59, 59).toISOString() };
        case "SEMESTER_2": // ~Nov-Mar
            return { from: new Date(ceYear, 10, 1).toISOString(), to: new Date(ceYear + 1, 2, 31, 23, 59, 59).toISOString() };
        case "SUMMER": // ~Apr-May
            return { from: new Date(ceYear + 1, 3, 1).toISOString(), to: new Date(ceYear + 1, 5, 30, 23, 59, 59).toISOString() };
        default:
            return { from: new Date(ceYear, 0, 1).toISOString(), to: new Date(ceYear + 1, 0, 0, 23, 59, 59).toISOString() };
    }
}

// ─── Time Filter Component ───────────────────────────────────────────────

export type TimeFilterMode = "all" | "season" | "term" | "custom";

export function BorrowTimeFilter({
    filters,
    dateFrom, dateTo,
    onDateChange,
}: {
    filters: BorrowAnalytics["filters"];
    dateFrom?: string;
    dateTo?: string;
    onDateChange: (from?: string, to?: string) => void;
}) {
    const [mode, setMode] = useState<TimeFilterMode>("all");
    const [selectedSeason, setSelectedSeason] = useState<string>("");
    const [selectedTerm, setSelectedTerm] = useState<string>("");
    const [selectedYear, setSelectedYear] = useState<number>(2568);
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    const years = filters?.academicYears || [];
    const seasons = filters?.seasons || [];
    const termTypes = filters?.termTypes || [];

    const handleModeChange = useCallback((m: TimeFilterMode) => {
        setMode(m);
        if (m === "all") onDateChange(undefined, undefined);
    }, [onDateChange]);

    const handleSeasonChange = useCallback((code: string) => {
        setSelectedSeason(code);
        const season = seasons.find((s) => s.season_code === code);
        if (season) {
            const range = seasonToDateRange(season.month_start, season.month_end, selectedYear);
            onDateChange(range.from, range.to);
        }
    }, [seasons, selectedYear, onDateChange]);

    const handleTermChange = useCallback((code: string) => {
        setSelectedTerm(code);
        const range = termToDateRange(code, selectedYear);
        onDateChange(range.from, range.to);
    }, [selectedYear, onDateChange]);

    const handleYearChange = useCallback((year: number) => {
        setSelectedYear(year);
        if (mode === "season" && selectedSeason) {
            const season = seasons.find((s) => s.season_code === selectedSeason);
            if (season) {
                const range = seasonToDateRange(season.month_start, season.month_end, year);
                onDateChange(range.from, range.to);
            }
        } else if (mode === "term" && selectedTerm) {
            const range = termToDateRange(selectedTerm, year);
            onDateChange(range.from, range.to);
        }
    }, [mode, selectedSeason, selectedTerm, seasons, onDateChange]);

    const handleCustomApply = useCallback(() => {
        if (customFrom && customTo) {
            onDateChange(new Date(customFrom).toISOString(), new Date(customTo + "T23:59:59").toISOString());
        }
    }, [customFrom, customTo, onDateChange]);

    return (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden" style={{ minWidth: 520 }}>
                {/* Mode Tabs */}
                <div className="flex border-b border-gray-100">
                    {([
                        { key: "all" as const, label: "ทั้งหมด", icon: "📊" },
                        { key: "season" as const, label: "ฤดูกาล", icon: "🌦️" },
                        { key: "term" as const, label: "ช่วงเทอม", icon: "📅" },
                        { key: "custom" as const, label: "กำหนดเอง", icon: "📆" },
                    ]).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleModeChange(tab.key)}
                            className={`flex-1 px-3 py-2.5 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${mode === tab.key
                                ? "bg-indigo-600 text-white"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                }`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filter Body */}
                <div className="px-4 py-3">
                    {/* Year selector (for season/term modes) */}
                    {(mode === "season" || mode === "term") && (
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">ปีการศึกษา</span>
                            <div className="flex gap-1 flex-1 overflow-x-auto">
                                {years.slice(0, 8).map((y) => (
                                    <button
                                        key={y}
                                        onClick={() => handleYearChange(y)}
                                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${selectedYear === y
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                            }`}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Season selector */}
                    {mode === "season" && (
                        <div className="flex gap-2">
                            {seasons.map((s) => (
                                <button
                                    key={s.season_code}
                                    onClick={() => handleSeasonChange(s.season_code)}
                                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center gap-1 ${selectedSeason === s.season_code
                                        ? `bg-gradient-to-br ${SEASON_COLORS[s.season_code]} text-white shadow-lg`
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                                        }`}
                                >
                                    {SEASON_ICONS[s.season_code]}
                                    <span>{s.season_name_th}</span>
                                    <span className={`text-[9px] ${selectedSeason === s.season_code ? "text-white/70" : "text-gray-400"}`}>
                                        {THAI_MONTHS[s.month_start]}–{THAI_MONTHS[s.month_end]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Term selector */}
                    {mode === "term" && (
                        <div className="flex gap-2">
                            {termTypes.map((t) => (
                                <button
                                    key={t.code}
                                    onClick={() => handleTermChange(t.code)}
                                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${selectedTerm === t.code
                                        ? "bg-indigo-600 text-white shadow-lg"
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                                        }`}
                                >
                                    <BookOpen className="w-3 h-3" />
                                    {t.name_th}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Custom date range */}
                    {mode === "custom" && (
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="text-[9px] font-bold text-gray-400 block mb-1">จาก</label>
                                <input
                                    type="date"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    className="w-full px-2.5 py-2 text-[11px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
                                />
                            </div>
                            <div className="text-gray-300 mt-4">→</div>
                            <div className="flex-1">
                                <label className="text-[9px] font-bold text-gray-400 block mb-1">ถึง</label>
                                <input
                                    type="date"
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    className="w-full px-2.5 py-2 text-[11px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
                                />
                            </div>
                            <button
                                onClick={handleCustomApply}
                                disabled={!customFrom || !customTo}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                ค้นหา
                            </button>
                        </div>
                    )}

                    {/* Active filter label */}
                    {mode !== "all" && dateFrom && (
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[9px] text-gray-400">
                                🔍 {new Date(dateFrom).toLocaleDateString("th-TH")} — {dateTo ? new Date(dateTo).toLocaleDateString("th-TH") : "ปัจจุบัน"}
                            </span>
                            <button onClick={() => handleModeChange("all")} className="text-[9px] text-indigo-600 font-bold hover:underline">
                                ✕ ล้าง
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


// ─── Line Color by Volume ─────────────────────────────────────────────────

function getLineStyle(count: number, maxCount: number) {
    const ratio = count / Math.max(maxCount, 1);
    if (ratio > 0.7) return { color: "#dc2626", weight: 4, opacity: 0.85 };
    if (ratio > 0.4) return { color: "#f59e0b", weight: 3, opacity: 0.7 };
    if (ratio > 0.2) return { color: "#3b82f6", weight: 2.5, opacity: 0.55 };
    return { color: "#94a3b8", weight: 1.5, opacity: 0.35 };
}

// ─── Polyline Connections ─────────────────────────────────────────────────

export function BorrowPolylines({
    pairs,
    selectedBorrower,
    topN = 10,
}: {
    pairs: BorrowPair[];
    selectedBorrower: number | null;
    topN?: number;
}) {
    const maxCount = useMemo(() => Math.max(...pairs.map((p) => p.borrow_count), 1), [pairs]);

    const filtered = useMemo(() => {
        if (selectedBorrower) {
            // Show only this uni's connections, sorted by count, limited to topN
            return pairs
                .filter((p) => p.from_id === selectedBorrower || p.to_id === selectedBorrower)
                .sort((a, b) => b.borrow_count - a.borrow_count)
                .slice(0, topN);
        }
        // Global view: top N pairs by count
        return [...pairs].sort((a, b) => b.borrow_count - a.borrow_count).slice(0, topN * 3);
    }, [pairs, selectedBorrower, topN]);

    return (
        <>
            {filtered.map((pair) => {
                const style = getLineStyle(pair.borrow_count, maxCount);
                const isSelected = selectedBorrower && (pair.from_id === selectedBorrower || pair.to_id === selectedBorrower);
                return (
                    <Polyline
                        key={`${pair.from_id}-${pair.to_id}`}
                        positions={[
                            [pair.from_lat, pair.from_lng],
                            [pair.to_lat, pair.to_lng],
                        ]}
                        pathOptions={{
                            ...style,
                            weight: isSelected ? style.weight + 1.5 : style.weight,
                            opacity: isSelected ? 0.95 : style.opacity,
                            dashArray: pair.borrow_count <= 1 ? "6 4" : undefined,
                        }}
                    >
                        <Popup>
                            <div style={{ padding: "6px", minWidth: 220 }}>
                                <div style={{ fontWeight: 800, fontSize: "13px", color: "#1e293b", marginBottom: "8px" }}>
                                    🔗 เครือข่ายยืมตัว
                                </div>
                                <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                                    <span style={{ color: "#6b7280" }}>ผู้ยืม:</span>{" "}
                                    <strong style={{ color: "#2563eb" }}>{pair.from_name}</strong>
                                </div>
                                <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                                    <span style={{ color: "#6b7280" }}>ถูกยืม:</span>{" "}
                                    <strong style={{ color: "#059669" }}>{pair.to_name}</strong>
                                </div>
                                <div style={{
                                    background: "#f8fafc", borderRadius: "8px", padding: "8px", marginBottom: "6px",
                                    display: "flex", justifyContent: "space-between", alignItems: "center"
                                }}>
                                    <span style={{ fontSize: "11px", color: "#6b7280" }}>จำนวนครั้ง</span>
                                    <span style={{ fontSize: "16px", fontWeight: 900, color: "#dc2626" }}>{pair.borrow_count}</span>
                                </div>
                                <div style={{ fontSize: "10px", color: "#9ca3af" }}>
                                    ปัญหา: {pair.problems}
                                </div>
                            </div>
                        </Popup>
                    </Polyline>
                );
            })}
        </>
    );
}

// ─── Borrowing Legend Panel ────────────────────────────────────────────────

export function BorrowLegend({
    data,
    selectedBorrower,
    onSelectBorrower,
}: {
    data: BorrowAnalytics;
    selectedBorrower: number | null;
    onSelectBorrower: (id: number | null) => void;
}) {
    return (
        <div className="absolute top-4 left-4 z-[1000] pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden" style={{ minWidth: 260, maxHeight: "calc(100vh - 12rem)" }}>
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white">
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black tracking-tight">เครือข่ายการยืมตัว</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] opacity-80">
                        <span>📋 {data.summary.total_requests.toLocaleString()} คำขอ</span>
                        <span>✅ {data.summary.total_completed.toLocaleString()} สำเร็จ</span>
                    </div>
                </div>

                {/* Problem Breakdown */}
                <div className="p-3 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">ปัญหาที่ยืมมากสุด</p>
                    <div className="space-y-1.5">
                        {data.problemBreakdown.slice(0, 5).map((p, i) => (
                            <div key={p.problem} className="flex items-center gap-2">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-[10px] font-semibold text-gray-600 truncate" style={{ maxWidth: 150 }}>
                                            {i === 0 ? "🔴" : i === 1 ? "🟠" : i === 2 ? "🟡" : "🟢"} {p.problem}
                                        </span>
                                        <span className="text-[10px] font-black text-gray-800 ml-1">{p.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1">
                                        <div
                                            className="h-1 rounded-full transition-all"
                                            style={{
                                                width: `${p.percentage}%`,
                                                background: i === 0 ? "#dc2626" : i === 1 ? "#f97316" : i === 2 ? "#f59e0b" : "#22c55e",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Line Legend */}
                <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">ระดับการยืม</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {[
                            { label: "ยืมมาก", color: "#dc2626" },
                            { label: "ปานกลาง", color: "#f59e0b" },
                            { label: "น้อย", color: "#3b82f6" },
                            { label: "น้อยมาก", color: "#94a3b8" },
                        ].map((l) => (
                            <div key={l.label} className="flex items-center gap-1.5">
                                <div className="w-6 h-0.5 rounded" style={{ background: l.color }} />
                                <span className="text-[9px] text-gray-500">{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Select hint */}
                <div className="px-3 py-2 bg-gray-50/80">
                    <p className="text-[9px] text-gray-400 text-center">
                        {selectedBorrower ? (
                            <button onClick={() => onSelectBorrower(null)} className="text-primary font-bold hover:underline">
                                ✕ ล้างการเลือก — ดูทั้งหมด
                            </button>
                        ) : (
                            "🖱️ คลิกอันดับด้านขวาเพื่อดูเส้นทาง"
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Borrowing Rankings (Right Panel) ────────────────────────────────────

export function BorrowRankings({
    data,
    selectedBorrower,
    onSelectBorrower,
    topN,
    onTopNChange,
}: {
    data: BorrowAnalytics;
    selectedBorrower: number | null;
    onSelectBorrower: (id: number | null) => void;
    topN: number;
    onTopNChange: (n: number) => void;
}) {
    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-sm font-black text-gray-900">Top {topN} มหาวิทยาลัยยืมมากสุด</h3>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">ตั้งแต่ปี 2562 — ปัจจุบัน</p>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-black text-indigo-600">{data.summary.total_assigned.toLocaleString()}</div>
                        <div className="text-[9px] text-gray-400">ยืมทั้งหมด</div>
                    </div>
                </div>
                {/* Top N Tab Selector */}
                <div className="flex gap-1 mt-3 bg-gray-100 rounded-lg p-0.5">
                    {[3, 5, 10].map((n) => (
                        <button
                            key={n}
                            onClick={() => onTopNChange(n)}
                            className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${topN === n
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-gray-500 hover:bg-white hover:text-gray-700"
                                }`}
                        >
                            Top {n}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rankings List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {data.topBorrowers.slice(0, topN).map((b, i) => {
                    const isSelected = selectedBorrower === b.uni_id;
                    return (
                        <button
                            key={b.uni_id}
                            onClick={() => onSelectBorrower(isSelected ? null : b.uni_id)}
                            className={`w-full px-4 py-3 border-b border-gray-50 text-left transition-all hover:bg-indigo-50/50 ${isSelected ? "bg-indigo-50 ring-1 ring-indigo-200" : ""
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Rank Badge */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${i < 3 ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm" : "bg-gray-100 text-gray-500"
                                    }`}>
                                    {i + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-bold text-gray-800 truncate" style={{ maxWidth: 180 }}>
                                            {b.name}
                                        </span>
                                        <span className="text-sm font-black text-indigo-600 ml-2">{b.total_borrowed}</span>
                                    </div>

                                    {/* Top 3 Destinations */}
                                    {b.topDestinations.length > 0 && (
                                        <div className="mt-1.5 space-y-0.5">
                                            <span className="text-[9px] text-gray-400 font-semibold uppercase">ยืมจาก:</span>
                                            {b.topDestinations.map((d, j) => (
                                                <div key={d.code} className="flex items-center gap-1.5 ml-1">
                                                    <span className="text-[9px]">{j === 0 ? "🥇" : j === 1 ? "🥈" : "🥉"}</span>
                                                    <span className="text-[10px] text-gray-600 truncate" style={{ maxWidth: 140 }}>
                                                        {d.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 ml-auto">{d.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
