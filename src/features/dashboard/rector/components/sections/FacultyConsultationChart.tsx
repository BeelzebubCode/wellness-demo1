"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Cell, LabelList, ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Download, Filter, ChevronDown, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

const COLORS = [
    "#7c3aed", "#6366f1", "#3b82f6", "#06b6d4", "#14b8a6",
    "#22c55e", "#eab308", "#f97316", "#ef4444", "#ec4899",
    "#8b5cf6", "#a855f7",
];

type Preset = "7d" | "30d" | "90d" | "all";
const PRESETS: { value: Preset; label: string }[] = [
    { value: "7d",  label: "7 วัน"  },
    { value: "30d", label: "30 วัน" },
    { value: "90d", label: "90 วัน" },
    { value: "all", label: "ทั้งหมด" },
];
function presetToParams(preset: Preset): Record<string, string> {
    if (preset === "all") return { all_time: "true" };
    const days  = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    const end   = new Date();
    const start = new Date(); start.setDate(start.getDate() - days);
    return {
        date_start: start.toISOString().split("T")[0],
        date_end:   end.toISOString().split("T")[0],
    };
}

interface FacBooking { id: number; nameTh: string; code: string; count: number; }
const API = "/api/v2/dashboards/rector/story";

/** Generate story insights from faculty data */
function buildFacultyInsights(sorted: FacBooking[], total: number) {
    if (sorted.length === 0) return [];
    const insights: { icon: React.ReactNode; text: string; color: string }[] = [];

    const top    = sorted[0];
    const bottom = sorted[sorted.length - 1];
    const topPct = total > 0 ? Math.round((top.count / total) * 100) : 0;

    // Top faculty concentration
    if (topPct > 40) {
        insights.push({
            icon:  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />,
            color: "text-amber-700 bg-amber-50 border-amber-100",
            text:  `⚠ "${top.nameTh}" มีสัดส่วนสูงผิดปกติ ${topPct}% ของทั้งมหาวิทยาลัย — ควรตรวจสอบภาระงานบุคลากร`,
        });
    } else {
        insights.push({
            icon:  <TrendingUp className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />,
            color: "text-indigo-700 bg-indigo-50 border-indigo-100",
            text:  `คณะที่ใช้บริการมากสุด: "${top.nameTh}" — ${top.count.toLocaleString()} ครั้ง (${topPct}% ของทั้งหมด)`,
        });
    }

    // Top 3 coverage
    if (sorted.length >= 3) {
        const top3Total = sorted.slice(0, 3).reduce((s, d) => s + d.count, 0);
        const top3Pct   = total > 0 ? Math.round((top3Total / total) * 100) : 0;
        if (top3Pct > 60) {
            insights.push({
                icon:  <TrendingUp className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />,
                color: "text-purple-700 bg-purple-50 border-purple-100",
                text:  `3 คณะแรกรวมกัน ${top3Pct}% ของการให้บริการทั้งหมด — ควรจัดสรรทรัพยากรให้เพียงพอ`,
            });
        }
    }

    // Low usage faculty
    if (sorted.length >= 4 && bottom.count < 5) {
        insights.push({
            icon:  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />,
            color: "text-slate-600 bg-slate-50 border-slate-100",
            text:  `"${bottom.nameTh}" มีการใช้บริการต่ำ (${bottom.count} ครั้ง) — ควรประเมินการเข้าถึงบริการในคณะนี้`,
        });
    }

    return insights;
}

export default function FacultyConsultationChart() {
    const router = useRouter();
    const [data,       setData]       = useState<FacBooking[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [showFilter, setShowFilter] = useState(false);
    const [preset,     setPreset]     = useState<Preset>("all");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ story: "departments", ...presetToParams(preset) });
                const res  = await fetch(`${API}?${params.toString()}`, { credentials: "include" });
                const json = await res.json();
                if (!cancelled) setData(json.data?.facultyBookings ?? []);
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [preset]);

    const sorted     = useMemo(() => [...data].sort((a, b) => b.count - a.count), [data]);
    const totalCount = sorted.reduce((s, d) => s + d.count, 0);
    const maxCount   = Math.max(...sorted.map(d => d.count), 1);

    const exportCSV = () => {
        const bom    = "\uFEFF";
        const header = "คณะ,รหัสคณะ,จำนวนการปรึกษา (ครั้ง),สัดส่วน (%)\n";
        const rows   = sorted.map(f =>
            `${f.nameTh},${f.code},${f.count},${totalCount > 0 ? ((f.count / totalCount) * 100).toFixed(2) : "0.00"}`
        ).join("\n");
        const blob = new Blob([bom + header + rows + `\nรวมทั้งหมด,,${totalCount},100.00`], { type: "text/csv;charset=utf-8;" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `rector_faculty_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "100ms" }}>

            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 grid place-items-center shadow-lg shadow-purple-200">
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">จำนวนครั้งปรึกษา แยกตามคณะ</h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">เปรียบเทียบปริมาณการใช้บริการระหว่างคณะ — ใช้จัดสรรทรัพยากรและวางแผนนโยบาย</p>
                        <p className="text-xs text-slate-400">กดที่แท่งเพื่อดูรายละเอียดระดับคณะ</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* total chip */}
                    <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                        <span className="font-bold text-slate-500">รวม: </span>
                        <span className="font-black text-purple-600">{totalCount.toLocaleString()}</span>
                        <span className="text-slate-400 ml-1">ครั้ง</span>
                    </div>

                    {/* filter toggle */}
                    <button
                        onClick={() => setShowFilter(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            showFilter
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-600"
                        }`}
                    >
                        <Filter size={13} />
                        ตัวกรอง
                        <ChevronDown size={12} className={`transition-transform ${showFilter ? "rotate-180" : ""}`} />
                    </button>

                    {/* export */}
                    <button
                        onClick={exportCSV}
                        disabled={sorted.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all disabled:opacity-40"
                    >
                        <Download size={13} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filter panel — preset buttons only, no calendar popup */}
            {showFilter && (
                <div className="mb-4 flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 mr-1">ช่วงเวลา:</span>
                    {PRESETS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPreset(p.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                preset === p.value
                                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-600"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Story narration line */}
            {!loading && sorted.length > 0 && (
                <p className="mb-3 text-sm text-slate-500 font-medium leading-relaxed">
                    {(() => {
                        const top    = sorted[0];
                        const topPct = totalCount > 0 ? Math.round((top.count / totalCount) * 100) : 0;
                        if (topPct > 40) return `"${top.nameTh}" ใช้บริการสูงถึง ${topPct}% ของทั้งมหาวิทยาลัย — ควรตรวจสอบภาระงาน`;
                        return `${sorted.length} คณะ รวม ${totalCount.toLocaleString()} ครั้ง — "${top.nameTh}" นำด้วย ${topPct}%`;
                    })()}
                </p>
            )}

            {/* Chart */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-slate-100">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                    <span className="text-sm text-slate-400">กำลังประมวลผล...</span>
                </div>
            ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300 rounded-xl border border-dashed border-slate-100">
                    <GraduationCap className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm font-medium">ยังไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
                </div>
            ) : (
                <>
                {/* Insight Box */}
                {(() => {
                    const ins = buildFacultyInsights(sorted, totalCount);
                    if (!ins.length) return null;
                    return (
                        <div className="mb-4 space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📊 Story Insights</p>
                            {ins.map((item, i) => (
                                <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-xs font-medium leading-relaxed ${item.color}`}>
                                    {item.icon}
                                    <span>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    );
                })()}

                <div className="h-[400px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 70, left: 20, bottom: 5 }}>
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                                domain={[0, Math.ceil(maxCount * 1.2)]} />
                            <YAxis type="category" dataKey="nameTh" width={160}
                                tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: "#f8fafc" }}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.[0]) return null;
                                    const d = payload[0].payload as FacBooking;
                                    const pct = totalCount > 0 ? ((d.count / totalCount) * 100).toFixed(1) : "0.0";
                                    return (
                                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl text-xs min-w-[190px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-1 h-4 rounded-full bg-purple-500" />
                                                <p className="font-bold text-slate-800 text-sm">{d.nameTh}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-400">การปรึกษา:</span>
                                                    <span className="font-bold text-purple-600">{d.count.toLocaleString()} ครั้ง</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-400">สัดส่วน:</span>
                                                    <span className="font-bold text-slate-700">{pct}%</span>
                                                </div>
                                                <div className="pt-1.5 border-t border-slate-100 text-center text-[10px] text-indigo-500 font-semibold">
                                                    คลิกเพื่อดูรายละเอียดคณะ →
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                            <Bar
                                dataKey="count"
                                radius={[0, 10, 10, 0]}
                                barSize={24}
                                cursor="pointer"
                                onClick={(_d: unknown, idx: number) => router.push(`/dean?faculty=${sorted[idx]?.id}`)}
                            >
                                {sorted.map((_, idx) => (
                                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                ))}
                                <LabelList
                                    dataKey="count"
                                    position="right"
                                    formatter={(v: unknown) => Number(v).toLocaleString()}
                                    style={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }}
                                    offset={12}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                </>
            )}
        </div>
    );
}
