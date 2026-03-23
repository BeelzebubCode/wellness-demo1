// src/features/dashboard/ministry/components/RegionalProblemDrillDown.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Drill-down Donut chart: Region → Province → University
// + Filters: Income, Family, Blood group, Season (with year picker)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { MapPin, ChevronRight, Layers, Building2, Globe, AlertTriangle } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../../widgets/story/StoryFilterChips";
import { DatePresetBar } from "../../shared/StoryUI";
import { getDateRange, type DatePreset, type DateRange } from "../../shared/story-utils";

// ── Colors ───────────────────────────────────────────────────────────────────
const DONUT_COLORS = [
    "#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444",
    "#3b82f6", "#8b5cf6", "#10b981", "#f97316", "#06b6d4",
    "#d946ef", "#eab308", "#64748b", "#a3a3a3", "#84cc16",
    "#e11d48", "#0ea5e9", "#7c3aed", "#059669", "#dc2626",
];

const PROBLEM_COLORS = [
    "#ef4444", "#f59e0b", "#f97316", "#10b981", "#06b6d4",
    "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#eab308",
];

type DrillLevel = "region" | "province" | "university";

interface BreadcrumbItem { id?: number; name: string; level: DrillLevel; }
interface DrillItem { id: number; name: string; totalProblems: number; }
interface ProblemItem { label: string; count: number; }
interface SeasonItem { id: number; name: string; }

interface DrillData {
    level: DrillLevel;
    breadcrumb: BreadcrumbItem[];
    items: DrillItem[];
    problemSummary: ProblemItem[];
    dataRange: { minDate: string; maxDate: string } | null;
    seasons: SeasonItem[];
}

const LEVEL_LABEL: Record<DrillLevel, string> = {
    region: "ภูมิภาค", province: "จังหวัด", university: "มหาวิทยาลัย",
};
const LEVEL_ICON: Record<DrillLevel, React.ReactNode> = {
    region: <Globe className="w-3.5 h-3.5" />,
    province: <MapPin className="w-3.5 h-3.5" />,
    university: <Building2 className="w-3.5 h-3.5" />,
};

// Season → month mapping (Thai academic seasons)
const SEASON_MONTHS: Record<string, string[]> = {
    "1": ["06", "07", "08", "09"],       // ฤดูฝน (Jun-Sep)
    "2": ["10", "11", "12", "01", "02"], // ฤดูหนาว (Oct-Feb)
    "3": ["03", "04", "05"],              // ฤดูร้อน (Mar-May)
};

// Generate year options
function getYearOptions(): { value: string; label: string }[] {
    const now = new Date();
    const currentBE = now.getFullYear() + 543;
    const years: { value: string; label: string }[] = [];
    for (let be = currentBE; be >= currentBE - 7; be--) {
        const ce = be - 543;
        years.push({ value: String(ce), label: `พ.ศ. ${be}` });
    }
    return years;
}

// ── Custom label for donut ───────────────────────────────────────────────────
function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
            fontSize={11} fontWeight={700}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function RegionalProblemDrillDown({ delay = 0 }: { delay?: number }) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [data, setData] = useState<DrillData | null>(null);
    const [loading, setLoading] = useState(true);

    // Drill state
    const [level, setLevel] = useState<DrillLevel>("region");
    const [regionId, setRegionId] = useState<number | undefined>();
    const [provinceId, setProvinceId] = useState<number | undefined>();

    // Filter state
    const [income, setIncome] = useState<string[]>([]);
    const [parental, setParental] = useState<string[]>([]);
    const [blood, setBlood] = useState<string[]>([]);
    const [seasonId, setSeasonId] = useState<string>("");
    const [seasonYear, setSeasonYear] = useState<string>("");

    const yearOptions = getYearOptions();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const sp = new URLSearchParams();
            sp.set("level", level);
            if (regionId) sp.set("region_id", String(regionId));
            if (provinceId) sp.set("province_id", String(provinceId));

            // Date: if season is selected, use season_months + year instead
            if (seasonId && seasonYear && SEASON_MONTHS[seasonId]) {
                sp.set("season_months", SEASON_MONTHS[seasonId].join(","));
                sp.set("season_year", seasonYear);
            } else {
                const dr = getDateRange(date, customRange);
                if (dr.allTime) sp.set("all_time", "true");
                else {
                    if (dr.start) sp.set("date_start", dr.start);
                    if (dr.end) sp.set("date_end", dr.end);
                }
            }

            // Demographic filters
            if (income.length) sp.set("income_bracket", income.join(","));
            if (parental.length) sp.set("parental_status", parental.join(","));
            if (blood.length) sp.set("blood_group", blood.join(","));

            const res = await fetch(`/api/v2/dashboards/ministry/regional-problems?${sp}`, {
                credentials: "include", cache: "no-store",
            });
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }, [level, regionId, provinceId, date, customRange, income, parental, blood, seasonId, seasonYear]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Season change — clear date preset
    const handleSeasonChange = (ids: string[]) => {
        const newId = ids.length > 0 ? ids[ids.length - 1] : "";
        setSeasonId(newId);
        if (newId && !seasonYear) {
            // Default to current year
            setSeasonYear(String(new Date().getFullYear()));
        }
        if (!newId) {
            setSeasonYear("");
        }
    };

    const handleYearChange = (ids: string[]) => {
        setSeasonYear(ids.length > 0 ? ids[ids.length - 1] : "");
    };

    // Drill handlers
    const handleDrill = (item: DrillItem) => {
        if (level === "region") {
            setRegionId(item.id);
            setLevel("province");
        } else if (level === "province") {
            setProvinceId(item.id);
            setLevel("university");
        }
    };

    const handleBreadcrumb = (bc: BreadcrumbItem) => {
        if (bc.level === "region") {
            setLevel("region");
            setRegionId(undefined);
            setProvinceId(undefined);
        } else if (bc.level === "province") {
            setLevel("province");
            setRegionId(bc.id);
            setProvinceId(undefined);
        }
    };

    // Computed
    const items = data?.items ?? [];
    const totalAll = items.reduce((s, i) => s + i.totalProblems, 0);
    const chartData = items.filter(i => i.totalProblems > 0).map(i => ({
        name: i.name, value: i.totalProblems, id: i.id,
    }));

    const seasonOptions = (data?.seasons ?? []).map(s => ({
        value: String(s.id), label: s.name,
    }));

    const narration = loading
        ? "กำลังโหลด..."
        : totalAll === 0
            ? "ยังไม่มีข้อมูลในช่วงเวลาที่เลือก"
            : `ทั้งหมด ${totalAll.toLocaleString()} กรณี จาก ${items.length} ${LEVEL_LABEL[level]} — "${items[0]?.name}" มากสุด (${items[0]?.totalProblems.toLocaleString()})`;

    return (
        <DataStoryCard
            icon={<Layers className="w-5 h-5" />}
            iconGradient="bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm"
            title="ภาพรวมปัญหาตามภูมิภาค"
            description="Drill-down ดูปัญหาจากภูมิภาค → จังหวัด → มหาวิทยาลัย — คลิกที่กราฟเพื่อดูรายละเอียดลึกขึ้น"
            narration={narration}
            kpis={data ? [
                { label: LEVEL_LABEL[level], value: items.length, color: "#6366f1" },
                { label: "กรณีทั้งหมด", value: totalAll, color: "#ef4444" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    {/* Date or Season filter */}
                    {!seasonId ? (
                        <DatePresetBar value={date} onChange={setDate}
                            customRange={customRange} onCustomRangeChange={setCustomRange} />
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">ปี:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {yearOptions.map(y => (
                                    <button
                                        key={y.value}
                                        onClick={() => handleYearChange(seasonYear === y.value ? [] : [y.value])}
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 ${seasonYear === y.value
                                                ? "bg-indigo-500 text-white shadow-sm"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                            }`}
                                    >
                                        {y.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Season */}
                    {seasonOptions.length > 0 && (
                        <StoryChipGroup label="ฤดูกาล" options={seasonOptions}
                            selected={seasonId ? [seasonId] : []}
                            onChange={handleSeasonChange} />
                    )}

                    {/* Income */}
                    <StoryChipGroup label="รายได้" options={[
                        { value: "UNDER_100K", label: "< 100K" },
                        { value: "BETWEEN_100K_200K", label: "100-200K" },
                        { value: "BETWEEN_200K_300K", label: "200-300K" },
                        { value: "BETWEEN_300K_500K", label: "300-500K" },
                        { value: "BETWEEN_500K_800K", label: "500-800K" },
                        { value: "BETWEEN_800K_1M", label: "800K-1M" },
                        { value: "OVER_1M", label: "> 1M" },
                    ]} selected={income} onChange={setIncome} />

                    {/* Parental status */}
                    <StoryChipGroup label="สถานะครอบครัว" options={[
                        { value: "TOGETHER", label: "อยู่ด้วยกัน" },
                        { value: "DIVORCED", label: "หย่าร้าง" },
                        { value: "SINGLE_PARENT", label: "เลี้ยงเดี่ยว" },
                        { value: "FATHER_DECEASED", label: "บิดาเสียชีวิต" },
                        { value: "MOTHER_DECEASED", label: "มารดาเสียชีวิต" },
                        { value: "BOTH_DECEASED", label: "เสียชีวิตทั้งคู่" },
                    ]} selected={parental} onChange={setParental} />

                    {/* Blood group */}
                    <StoryChipGroup label="กรุ๊ปเลือด" options={[
                        { value: "A", label: "A" }, { value: "B", label: "B" },
                        { value: "O", label: "O" }, { value: "AB", label: "AB" },
                    ]} selected={blood} onChange={setBlood} />
                </StoryFilterStack>
            }
            datePreset={seasonId ? undefined : date}
            dataRange={data?.dataRange}
            customRange={customRange}
            delay={delay}
            loading={loading}
        >
            {data && (
                <div className="space-y-4 mt-1">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {data.breadcrumb.map((bc, idx) => (
                            <React.Fragment key={idx}>
                                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                                <button
                                    onClick={() => handleBreadcrumb(bc)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${idx === data.breadcrumb.length - 1
                                            ? "bg-indigo-100 text-indigo-700"
                                            : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                        }`}
                                >
                                    {LEVEL_ICON[bc.level]}
                                    {bc.name}
                                </button>
                            </React.Fragment>
                        ))}
                        <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            แสดง: {LEVEL_LABEL[level]}
                        </span>
                    </div>

                    {/* Main content: Donut + Problem list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Donut chart */}
                        <div>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%" cy="50%"
                                            innerRadius={70} outerRadius={130}
                                            paddingAngle={2} dataKey="value"
                                            label={renderLabel} labelLine={false}
                                            cursor={level !== "university" ? "pointer" : "default"}
                                            onClick={(entry: any) => {
                                                if (level !== "university") {
                                                    const item = items.find(i => i.id === entry.id);
                                                    if (item) handleDrill(item);
                                                }
                                            }}
                                        >
                                            {chartData.map((_d, idx) => (
                                                <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]}
                                                    stroke="white" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (!active || !payload?.[0]) return null;
                                                const d = payload[0].payload;
                                                const pct = totalAll > 0 ? ((d.value / totalAll) * 100).toFixed(1) : "0";
                                                return (
                                                    <div className="bg-slate-900/95 rounded-xl px-3 py-2 text-xs border border-white/10 shadow-xl">
                                                        <p className="font-bold text-white mb-1">{d.name}</p>
                                                        <p className="text-white/70">
                                                            กรณี: <span className="font-bold text-white">{d.value.toLocaleString()}</span>
                                                        </p>
                                                        <p className="text-white/70">
                                                            สัดส่วน: <span className="font-bold text-indigo-300">{pct}%</span>
                                                        </p>
                                                        {level !== "university" && (
                                                            <p className="text-indigo-400 mt-1 text-[10px]">คลิกเพื่อดูรายละเอียด →</p>
                                                        )}
                                                    </div>
                                                );
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[320px] flex items-center justify-center text-slate-300 text-sm">
                                    ยังไม่มีข้อมูลในช่วงเวลาที่เลือก
                                </div>
                            )}

                            {/* Legend */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
                                {chartData.slice(0, 12).map((d, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (level !== "university") {
                                                const item = items.find(i => i.id === d.id);
                                                if (item) handleDrill(item);
                                            }
                                        }}
                                        className={`flex items-center gap-1.5 text-[11px] text-slate-600 ${level !== "university" ? "hover:text-indigo-600 cursor-pointer" : ""
                                            }`}
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
                                        <span className="truncate max-w-[120px]">{d.name}</span>
                                        <span className="font-bold tabular-nums">{d.value.toLocaleString()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Problem category breakdown */}
                        <div>
                            <div className="flex items-center gap-1.5 mb-3">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    ปัญหาที่พบบ่อย ({LEVEL_LABEL[level]})
                                </p>
                            </div>

                            {(data.problemSummary ?? []).length > 0 ? (
                                <div className="space-y-2">
                                    {data.problemSummary.map((p, i) => {
                                        const maxCount = data.problemSummary[0]?.count ?? 1;
                                        const pct = Math.round((p.count / maxCount) * 100);
                                        const totalPct = totalAll > 0 ? ((p.count / totalAll) * 100).toFixed(1) : "0";
                                        return (
                                            <div key={i}>
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-[11px] font-semibold text-slate-700 truncate flex-1">
                                                        {p.label}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-500 tabular-nums ml-2">
                                                        {p.count.toLocaleString()}
                                                        <span className="text-slate-400 font-medium ml-1">({totalPct}%)</span>
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${pct}%`,
                                                            backgroundColor: PROBLEM_COLORS[i % PROBLEM_COLORS.length],
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-32 flex items-center justify-center text-slate-300 text-sm">
                                    ไม่มีข้อมูลปัญหา
                                </div>
                            )}

                            {/* Drill hint */}
                            {level !== "university" && (
                                <div className="mt-4 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-600 font-medium">
                                    💡 คลิกที่ชิ้นส่วนของกราฟเพื่อดูข้อมูล{level === "region" ? "จังหวัด" : "มหาวิทยาลัย"}ในแต่ละ{LEVEL_LABEL[level]}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DataStoryCard>
    );
}
