// src/features/dashboard/head-department/components/RiskStory.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Card 4: ความเสี่ยงที่ต้องติดตาม — 5-level bar chart + drill-down + filters
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer,
} from "recharts";
import { ShieldAlert, MousePointerClick } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../../widgets/story/StoryFilterChips";
import { DatePresetBar, UnitToggle } from "./StoryUI";
import {
    useStoryData, INCOME_LABEL,
    type DatePreset, type DateRange, type UnitMode,
} from "./story-utils";
import ProblemDrillDown from "./ProblemDrillDown";

// ─── Risk level metadata ────────────────────────────────────────────────────
const RISK_LEVELS: {
    key: string;
    level: number | null;
    label: string;
    color: string;
    gradient: [string, string];
    bg: string;
}[] = [
        { key: "5", level: 5, label: "สูงมาก (5)", color: "#dc2626", gradient: ["#dc2626", "#f87171"], bg: "bg-red-50" },
        { key: "4", level: 4, label: "สูง (4)", color: "#f97316", gradient: ["#f97316", "#fb923c"], bg: "bg-orange-50" },
        { key: "3", level: 3, label: "ปานกลาง (3)", color: "#eab308", gradient: ["#eab308", "#facc15"], bg: "bg-yellow-50" },
        { key: "2", level: 2, label: "ต่ำ (2)", color: "#22c55e", gradient: ["#22c55e", "#4ade80"], bg: "bg-green-50" },
        { key: "1", level: 1, label: "ต่ำมาก (1)", color: "#06b6d4", gradient: ["#06b6d4", "#67e8f9"], bg: "bg-cyan-50" },
        { key: "UNKNOWN", level: null, label: "ไม่ระบุ", color: "#94a3b8", gradient: ["#94a3b8", "#cbd5e1"], bg: "bg-slate-50" },
    ];

function riskLabel(raw: string): string {
    return RISK_LEVELS.find(r => r.key === raw)?.label ?? raw;
}

function riskColor(raw: string): string {
    return RISK_LEVELS.find(r => r.key === raw)?.color ?? "#94a3b8";
}

const PARENTAL_LABEL: Record<string, string> = {
    TOGETHER: "อยู่ด้วยกัน", DIVORCED: "หย่าร้าง",
    FATHER_DECEASED: "บิดาเสีย", MOTHER_DECEASED: "มารดาเสีย",
    SINGLE_PARENT: "เลี้ยงเดี่ยว", UNKNOWN: "ไม่ระบุ",
};

export default function RiskStory({ delay = 0 }: { delay?: number }) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [unit, setUnit] = useState<UnitMode>("count");

    // Filters
    const [gender, setGender] = useState<string[]>([]);
    const [income, setIncome] = useState<string[]>([]);
    const [parental, setParental] = useState<string[]>([]);
    const [blood, setBlood] = useState<string[]>([]);
    const [advisorId, setAdvisorId] = useState<string[]>([]);

    // Drill-down
    const [drillRisk, setDrillRisk] = useState<string | null>(null);

    const { data, loading, advisors, dataRange } = useStoryData<any>("risk", {
        gender,
        family_income_bracket: income,
        parental_status: parental,
        blood_group: blood,
        advisorId,
    }, date, customRange);

    const dist: { label: string; count: number }[] = data?.distribution ?? [];
    const totalAll = dist.reduce((a, c) => a + c.count, 0);

    // Map to ordered risk levels
    const chartData = useMemo(() => {
        const countMap: Record<string, number> = {};
        dist.forEach(d => { countMap[d.label] = d.count; });

        return RISK_LEVELS.map(rl => {
            const raw = rl.key;
            const count = countMap[raw] ?? 0;
            const pct = totalAll > 0 ? Math.round(count / totalAll * 100) : 0;
            return {
                name: rl.label,
                raw,
                value: count,
                display: unit === "percent" ? pct : count,
                pct,
                color: rl.color,
            };
        }).filter(d => d.value > 0 || d.raw !== "UNKNOWN");
    }, [dist, totalAll, unit]);

    // Smart narration
    const highCount = dist.find(d => d.label === "5")?.count ?? 0;
    const medCount = dist.find(d => d.label === "3")?.count ?? 0;
    const narration = data
        ? `พบ ${totalAll} case — ความเสี่ยงสูงมาก ${highCount} คน, ปานกลาง ${medCount} คน`
        : "กำลังโหลด...";

    const handleBarClick = (_: any, idx: number) => {
        const item = chartData[idx];
        if (item) {
            // Use risk level number or "null" for unknown
            const riskParam = item.raw === "UNKNOWN" ? "null" : item.raw;
            setDrillRisk(riskParam);
        }
    };

    return (
        <>
            <DataStoryCard
                icon={<ShieldAlert className="w-5 h-5" />}
                iconGradient="bg-gradient-to-br from-red-500 to-rose-600"
                title="ความเสี่ยงที่ต้องติดตาม"
                narration={narration}
                kpis={data ? [
                    { label: "ทั้งหมด", value: totalAll, color: "#64748b" },
                    { label: "สูงมาก", value: highCount, color: "#dc2626" },
                ] : undefined}
                filters={
                    <StoryFilterStack>
                        <div className="flex items-center justify-between gap-3">
                            <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} dataRange={dataRange} />
                            <UnitToggle value={unit} onChange={setUnit} />
                        </div>
                        <StoryChipGroup label="เพศ" options={[
                            { value: "MALE", label: "ชาย" },
                            { value: "FEMALE", label: "หญิง" },
                            { value: "LGBTQ_PLUS", label: "LGBTQ+" },
                        ]} selected={gender} onChange={setGender} />
                        <StoryChipGroup label="รายได้" options={[
                            { value: "UNDER_100K", label: "< 100K" }, { value: "BETWEEN_100K_200K", label: "100-200K" },
                            { value: "BETWEEN_200K_300K", label: "200-300K" }, { value: "BETWEEN_300K_500K", label: "300-500K" },
                            { value: "BETWEEN_500K_800K", label: "500-800K" }, { value: "OVER_1M", label: "> 1M" },
                        ]} selected={income} onChange={setIncome} />
                        <StoryChipGroup label="ครอบครัว" options={[
                            { value: "TOGETHER", label: "อยู่ด้วยกัน" }, { value: "DIVORCED", label: "หย่าร้าง" },
                            { value: "FATHER_DECEASED", label: "บิดาเสีย" }, { value: "MOTHER_DECEASED", label: "มารดาเสีย" },
                            { value: "SINGLE_PARENT", label: "เลี้ยงเดี่ยว" },
                        ]} selected={parental} onChange={setParental} />
                        <StoryChipGroup label="กรุ๊ปเลือด" options={[
                            { value: "A", label: "A" }, { value: "B", label: "B" },
                            { value: "AB", label: "AB" }, { value: "O", label: "O" },
                        ]} selected={blood} onChange={setBlood} />
                        {advisors.length > 0 && (
                            <StoryChipGroup
                                label="อาจารย์ที่ปรึกษา"
                                options={advisors.map(a => ({ value: String(a.id), label: a.name }))}
                                selected={advisorId}
                                onChange={setAdvisorId}
                            />
                        )}
                    </StoryFilterStack>
                }
                datePreset={date}
                dataRange={dataRange}
                customRange={customRange}
                delay={delay}
                loading={loading}
            >
                <div className="space-y-4">
                    {/* Chart header with drill-down hint */}
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ระดับความเสี่ยง (5 ระดับ)</p>
                        <span className="text-[9px] text-rose-500 flex items-center gap-1">
                            <MousePointerClick className="w-3 h-3" /> คลิกแท่งเพื่อดูรายชื่อนิสิต
                        </span>
                    </div>

                    {/* Horizontal risk bars */}
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={chartData.length * 40 + 10}>
                            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 45 }}>
                                <defs>
                                    {RISK_LEVELS.map(rl => (
                                        <linearGradient key={rl.key} id={`risk-${rl.key}`} x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor={rl.gradient[0]} />
                                            <stop offset="100%" stopColor={rl.gradient[1]} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <XAxis
                                    type="number"
                                    domain={unit === "percent" ? [0, 100] : undefined}
                                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                                    axisLine={false} tickLine={false}
                                    tickFormatter={(v: number) => unit === "percent" ? `${v}%` : `${v}`}
                                />
                                <YAxis
                                    type="category" dataKey="name"
                                    tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                                    width={100} axisLine={false} tickLine={false}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const p = payload[0].payload as typeof chartData[0];
                                        return (
                                            <div className="bg-slate-900/95 backdrop-blur rounded-xl shadow-2xl px-4 py-2.5 text-xs border border-white/10">
                                                <p className="font-bold text-white mb-1">{p.name}</p>
                                                <p className="text-white/70">{p.value.toLocaleString()} คน ({p.pct}%)</p>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar
                                    dataKey="display"
                                    name={unit === "percent" ? "%" : "จำนวน"}
                                    radius={[0, 8, 8, 0]}
                                    barSize={22}
                                    cursor="pointer"
                                    onClick={handleBarClick}
                                    label={({ x, y, width, height, value }: any) => (
                                        <text
                                            x={x + width + 5} y={y + height / 2}
                                            fill="#475569" fontSize={10} dominantBaseline="middle" fontWeight={700}
                                        >
                                            {unit === "percent" ? `${value}%` : value}
                                        </text>
                                    )}
                                    shape={(props: any) => {
                                        const { x, y, width, height, payload } = props;
                                        const gradId = `risk-${payload.raw}`;
                                        return (
                                            <g>
                                                <rect
                                                    x={x} y={y} width={Math.max(width, 0)} height={height}
                                                    rx={8} ry={8}
                                                    fill={`url(#${gradId})`}
                                                    className="transition-opacity hover:opacity-80"
                                                />
                                                {/* Color dot */}
                                                <circle cx={x - 8} cy={y + height / 2} r={4} fill={payload.color} />
                                            </g>
                                        );
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-sm text-slate-400 py-6">ยังไม่มีข้อมูล</div>
                    )}

                    {/* Quick summary badges */}
                    {chartData.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {chartData.filter(d => d.value > 0).map(d => (
                                <button
                                    key={d.raw}
                                    onClick={() => {
                                        const riskParam = d.raw === "UNKNOWN" ? "null" : d.raw;
                                        setDrillRisk(riskParam);
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                                >
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                    <span className="text-[10px] text-slate-500 group-hover:text-slate-700">{d.name}</span>
                                    <span className="text-[10px] font-black tabular-nums" style={{ color: d.color }}>
                                        {d.value}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DataStoryCard>

            {/* Drill-down Modal — reuse same modal component */}
            {drillRisk && (
                <RiskDrillDownModal
                    riskLevel={drillRisk}
                    onClose={() => setDrillRisk(null)}
                />
            )}
        </>
    );
}

// ─── Risk-specific drill-down wrapper ────────────────────────────────────────
// Reuses the same ProblemDrillDown modal but fetches with risk_level param
function RiskDrillDownModal({ riskLevel, onClose }: { riskLevel: string; onClose: () => void }) {
    const riskMeta = RISK_LEVELS.find(r =>
        r.key === riskLevel || (riskLevel === "null" && r.key === "UNKNOWN")
    );
    const label = riskMeta?.label ?? `ระดับ ${riskLevel}`;

    // We need our own fetch since ProblemDrillDown uses category_name
    const [students, setStudents] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const sp = new URLSearchParams({ risk_level: riskLevel, limit: "10" });
                const res = await fetch(`/api/v2/dashboards/head-department/drill-down?${sp}`, {
                    credentials: "include",
                });
                if (cancelled) return;
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "เกิดข้อผิดพลาด");
                setStudents(json.data?.students ?? []);
            } catch (err: any) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [riskLevel]);

    // ESC key
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />
            <div
                className="relative w-full max-w-5xl max-h-[85vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-[slideUp_0.3s_ease-out]"
                onClick={e => e.stopPropagation()}
            >
                <style>{`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(24px) scale(0.97); }
                        to   { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}</style>

                {/* Header */}
                <div className="sticky top-0 px-6 py-4 flex items-center justify-between z-10"
                    style={{ background: `linear-gradient(135deg, ${riskMeta?.color ?? "#94a3b8"}, ${riskMeta?.gradient[1] ?? "#cbd5e1"})` }}>
                    <div>
                        <h2 className="text-lg font-black text-white">
                            🛡️ นิสิตความเสี่ยง: {label}
                        </h2>
                        <p className="text-white/80 text-xs mt-0.5">
                            Top 10 นิสิตที่มี booking ในระดับนี้ (เรียงจากมากไปน้อย)
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                        <span className="text-white text-lg">✕</span>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-auto max-h-[calc(85vh-72px)] p-5">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: riskMeta?.color ?? "#94a3b8" }} />
                            <p className="text-sm text-slate-400">กำลังโหลดข้อมูลนิสิต...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                            <p className="text-sm text-red-500 font-bold">เกิดข้อผิดพลาด</p>
                            <p className="text-xs text-slate-400">{error}</p>
                        </div>
                    )}

                    {!loading && !error && students.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                            <ShieldAlert className="w-10 h-10 text-slate-300" />
                            <p className="text-sm text-slate-400">ไม่พบนิสิตในระดับความเสี่ยงนี้</p>
                        </div>
                    )}

                    {!loading && !error && students.length > 0 && (
                        <div className="space-y-3">
                            {students.map((s: any, i: number) => (
                                <div key={s.studentId}
                                    className="group bg-white rounded-xl border border-slate-100 hover:border-rose-200 hover:shadow-lg transition-all p-4">
                                    <div className="flex items-start gap-4">
                                        {/* Rank */}
                                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${i === 0 ? "text-white shadow-lg" :
                                            i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white" :
                                                i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                                                    "bg-slate-100 text-slate-500"
                                            }`}
                                            style={i === 0 ? { background: `linear-gradient(135deg, ${riskMeta?.color}, ${riskMeta?.gradient[1]})` } : {}}>
                                            {i + 1}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h3 className="text-sm font-bold text-slate-800 truncate">{s.fullName}</h3>
                                                {s.studentCode && (
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{s.studentCode}</span>
                                                )}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${s.gender === "MALE" ? "bg-blue-50 text-blue-600" :
                                                    s.gender === "FEMALE" ? "bg-pink-50 text-pink-600" :
                                                        "bg-purple-50 text-purple-600"
                                                    }`}>
                                                    {s.gender === "MALE" ? "ชาย" : s.gender === "FEMALE" ? "หญิง" : s.gender === "LGBTQ_PLUS" ? "LGBTQ+" : s.gender ?? "-"}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                                    style={{ backgroundColor: `${riskMeta?.color}15`, color: riskMeta?.color }}>
                                                    จอง {s.bookingCount} ครั้ง
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <span className="text-slate-400">📞</span>
                                                    <span className="font-mono text-slate-700">
                                                        {s.phone ? s.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3") : "-"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <span className="text-slate-400">🎓</span>
                                                    <span>ปี {s.yearLevel > 0 ? s.yearLevel : "-"}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="truncate text-slate-700">{s.departmentName}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <span className="text-slate-400">📍</span>
                                                    <span className="truncate text-slate-700">{s.province ?? "-"}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <span className="text-slate-400 text-[10px]">คณะ</span>
                                                    <span className="truncate text-slate-700">{s.facultyName}</span>
                                                </div>
                                            </div>

                                            {s.advisorName && (
                                                <div className="mt-2 pt-2 border-t border-slate-50">
                                                    <div className="flex items-center gap-3 text-xs">
                                                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">อาจารย์ที่ปรึกษา</span>
                                                        <span className="text-slate-700 font-medium">{s.advisorName}</span>
                                                        {s.advisorPhone && (
                                                            <span className="flex items-center gap-1 text-slate-500">
                                                                <span className="text-indigo-400">📞</span>
                                                                <span className="font-mono">
                                                                    {s.advisorPhone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
