// src/features/dashboard/dean/components/DeanInsightPanel.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
    Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw,
    Users, Heart, Home, Activity, Building2, ChevronUp, ChevronDown,
    DollarSign, BarChart3, Minus,
} from "lucide-react";
import { INCOME_LABEL, toLocalISODate } from "../../shared/story-utils";
import { motion, AnimatePresence } from "framer-motion";

const API = "/api/v2/dashboards/dean/story";

// ── Preset helpers ─────────────────────────────────────────────────────────
type Preset = "month" | "3m" | "6m" | "year" | "all";
const PRESETS: { value: Preset; label: string }[] = [
    { value: "month", label: "เดือนนี้" },
    { value: "3m",    label: "3 เดือน" },
    { value: "6m",    label: "6 เดือน" },
    { value: "year",  label: "ปีนี้"   },
    { value: "all",   label: "ทั้งหมด" },
];

function buildDateParams(preset: Preset): string {
    if (preset === "all") return "all_time=true";
    const now = new Date();
    const end = toLocalISODate(now);
    let start: Date;
    switch (preset) {
        case "month": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case "3m":    start = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
        case "6m":    start = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
        case "year":  start = new Date(now.getFullYear(), 0, 1); break;
        default: start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return `date_start=${toLocalISODate(start)}&date_end=${end}`;
}

// ── Constants ──────────────────────────────────────────────────────────────
const PARENTAL_LABEL: Record<string, string> = {
    TOGETHER: "พ่อแม่อยู่ด้วยกัน", DIVORCED: "หย่าร้าง",
    FATHER_DECEASED: "บิดาเสียชีวิต", MOTHER_DECEASED: "มารดาเสียชีวิต",
    BOTH_DECEASED: "เสียชีวิตทั้งคู่", SINGLE_PARENT: "เลี้ยงเดี่ยว",
};

// ── Types ──────────────────────────────────────────────────────────────────
interface DeptSummary {
    id: number; nameTh: string; code: string; count: number;
}

interface InsightData {
    topProblems: { label: string; count: number; pct: number }[];
    topIncomes:  { label: string; count: number; pct: number }[];
    topParental: { label: string; count: number; pct: number }[];
    departments: DeptSummary[];
    highRiskCount: number;
    totalStudents: number;
    totalBookings: number;
}

// ── Budget recommendation logic ────────────────────────────────────────────
type BudgetSignal = "increase" | "decrease" | "maintain";
function getBudgetSignal(count: number, avg: number): BudgetSignal {
    if (count > avg * 1.3) return "increase";
    if (count < avg * 0.5) return "decrease";
    return "maintain";
}

const BUDGET_META: Record<BudgetSignal, { label: string; icon: React.ComponentType<{className?:string}>; color: string; bg: string; border: string }> = {
    increase: { label: "เพิ่มงบ",    icon: ChevronUp,   color: "text-rose-600",   bg: "bg-rose-50",   border: "border-rose-200" },
    decrease: { label: "พิจารณาลด",  icon: ChevronDown,  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    maintain: { label: "คงงบ",       icon: Minus,        color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
};

// ── Root-cause summary ─────────────────────────────────────────────────────
function RootCauseRow({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
            <span className="text-xs text-slate-500">{label}</span>
            <span className={`text-xs font-bold ${color}`}>{value}</span>
        </div>
    );
}

// ── Dept card ───────────────────────────────────────────────────────────────
function DeptBudgetCard({ dept, rank, signal, avg, topProblem }: {
    dept: DeptSummary; rank: number; signal: BudgetSignal; avg: number; topProblem?: string;
}) {
    const meta = BUDGET_META[signal];
    const BudgetIcon = meta.icon;
    const pct = avg > 0 ? Math.round((dept.count / avg - 1) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.05 }}
            className={`relative flex flex-col gap-2.5 p-4 rounded-2xl border ${meta.bg} ${meta.border} overflow-hidden`}
        >
            {/* rank badge */}
            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/70 flex items-center justify-center text-xs font-black text-slate-400">
                #{rank}
            </div>

            <div className="flex items-start gap-2 pr-8">
                <div className={`p-1.5 rounded-lg ${meta.bg} ring-1 ring-white/60 shrink-0`}>
                    <Building2 className={`w-4 h-4 ${meta.color}`} />
                </div>
                <p className="text-sm font-bold text-slate-700 leading-snug line-clamp-2">{dept.nameTh}</p>
            </div>

            <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black ${meta.color}`}>{dept.count.toLocaleString()}</span>
                <span className="text-xs text-slate-400 font-semibold">กรณี</span>
                <span className={`ml-auto text-xs font-black ${pct > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                    {pct > 0 ? "+" : ""}{pct}% vs. avg
                </span>
            </div>

            {topProblem && (
                <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs text-slate-500 font-medium truncate">{topProblem}</span>
                </div>
            )}

            <div className={`flex items-center gap-1.5 mt-auto px-3 py-1.5 rounded-lg border self-start ${meta.bg} ${meta.border}`}>
                <BudgetIcon className={`w-3.5 h-3.5 ${meta.color}`} />
                <span className={`text-xs font-black uppercase tracking-wide ${meta.color}`}>{meta.label}</span>
            </div>
        </motion.div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function DeanInsightPanel() {
    const [insight, setInsight] = useState<InsightData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const [preset, setPreset] = useState<Preset>("all");
    const [showAll, setShowAll] = useState(false);

    const fetchData = useCallback(async (p: Preset) => {
        setLoading(true);
        try {
            const dateQ = buildDateParams(p);
            const [allRes, riskRes, deptRes] = await Promise.all([
                fetch(`${API}?story=all&${dateQ}`, { credentials: "include" }),
                fetch(`${API}?story=risk&${dateQ}`, { credentials: "include" }),
                fetch(`${API}?story=departments&${dateQ}`, { credentials: "include" }),
            ]);
            const allJson  = await allRes.json();
            const riskJson = await riskRes.json();
            const deptJson = await deptRes.json();
            const d = allJson.data ?? {};
            const r = riskJson.data?.risk ?? {};

            const probs = (d.problems?.categories ?? []).map((c: any) => ({ label: c.label, count: c.count, pct: 0 }));
            const totalProblems = probs.reduce((s: number, p: any) => s + p.count, 0);
            probs.forEach((p: any) => { p.pct = totalProblems > 0 ? parseFloat((p.count / totalProblems * 100).toFixed(1)) : 0; });

            const incomes = (d.students?.familyIncome?.distribution ?? []).map((c: any) => ({ label: INCOME_LABEL[c.label] ?? c.label, count: c.count, pct: 0 }));
            const totalIncome = incomes.reduce((s: number, i: any) => s + i.count, 0);
            incomes.forEach((i: any) => { i.pct = totalIncome > 0 ? parseFloat((i.count / totalIncome * 100).toFixed(1)) : 0; });

            const parentals = (d.students?.parentalStatus?.distribution ?? []).map((c: any) => ({ label: PARENTAL_LABEL[c.label] ?? c.label, count: c.count, pct: 0 }));
            const totalParental = parentals.reduce((s: number, p: any) => s + p.count, 0);
            parentals.forEach((p: any) => { p.pct = totalParental > 0 ? parseFloat((p.count / totalParental * 100).toFixed(1)) : 0; });

            const depts: DeptSummary[] = [...(deptJson.data?.departmentBookings ?? [])].sort((a: any, b: any) => b.count - a.count);

            setInsight({
                topProblems: [...probs].sort((a, b) => b.count - a.count).slice(0, 5),
                topIncomes: incomes,
                topParental: parentals,
                departments: depts,
                highRiskCount: (r.distribution ?? []).filter((x: any) => ["4", "5", "HIGH", "VERY_HIGH"].includes(String(x.band))).reduce((s: number, x: any) => s + (x.count ?? 0), 0),
                totalStudents: d.students?.totalStudents ?? 0,
                totalBookings: d.bookings?.totalBookings ?? 0,
            });
            setLastRefreshed(new Date());
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(preset); }, [preset, fetchData]);

    // Compute avg, signals
    const deptAnalysis = useMemo(() => {
        if (!insight) return [];
        const avg = insight.departments.length > 0
            ? insight.departments.reduce((s, d) => s + d.count, 0) / insight.departments.length
            : 0;
        return insight.departments.map((dept, i) => ({
            dept,
            rank: i + 1,
            signal: getBudgetSignal(dept.count, avg),
            avg,
            topProblem: insight.topProblems[0]?.label,
        }));
    }, [insight]);

    const visibleDepts = showAll ? deptAnalysis : deptAnalysis.slice(0, 4);



    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-pink-100 p-7 mb-2"
            style={{ boxShadow: "0 4px 32px -4px rgba(236,72,153,0.08)" }}>
            {/* Decorative orbs */}
            <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-pink-200/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-rose-100/30 blur-3xl pointer-events-none" />

            {/* ── Header ── */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-md">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                            สรุปข้อมูลและข้อเสนอแนะเชิงนโยบาย
                            <span className="text-[10px] font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                                Auto Analysis
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            วิเคราะห์{PRESETS.find(p => p.value === preset)?.label ?? "ทั้งหมด"} • อัปเดต {lastRefreshed.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center p-1 rounded-xl bg-slate-100/80 border border-slate-200/50 shadow-inner">
                        {PRESETS.map(p => (
                            <button key={p.value} onClick={() => setPreset(p.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${preset === p.value ? "bg-white text-pink-600 shadow-sm border border-pink-100" : "text-slate-500 hover:text-slate-700"}`}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => fetchData(preset)} disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-40">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        รีเฟรช
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[0, 1, 2].map(i => <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 h-32 animate-pulse" />)}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[0, 1, 2, 3].map(i => <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 h-40 animate-pulse" />)}
                        </div>
                    </motion.div>
                ) : insight ? (
                    <motion.div key="data" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-5">

                        {/* ── Row 2: Dept Budget Analysis ── */}
                        {deptAnalysis.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <DollarSign className="w-4 h-4 text-pink-500" />
                                    <h4 className="text-sm font-black text-slate-700">การจัดสรรงบประมาณตามภาควิชา / สาขา</h4>
                                    <span className="text-[10px] text-slate-400 font-medium">— เปรียบเทียบจากค่าเฉลี่ยคณะ</span>
                                    <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                                        <span className="flex items-center gap-1"><ChevronUp className="w-3 h-3 text-rose-500" />เพิ่มงบ</span>
                                        <span className="flex items-center gap-1"><Minus className="w-3 h-3 text-blue-500" />คงงบ</span>
                                        <span className="flex items-center gap-1"><ChevronDown className="w-3 h-3 text-emerald-500" />พิจารณาลด</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {visibleDepts.map(({ dept, rank, signal, avg, topProblem }) => (
                                        <DeptBudgetCard key={dept.id} dept={dept} rank={rank} signal={signal} avg={avg} topProblem={topProblem} />
                                    ))}
                                </div>
                                {deptAnalysis.length > 4 && (
                                    <button onClick={() => setShowAll(v => !v)}
                                        className="mt-3 flex items-center gap-1.5 text-xs font-bold text-pink-500 hover:text-pink-700 transition-colors">
                                        <BarChart3 className="w-4 h-4" />
                                        {showAll ? "ย่อ" : `ดูทั้งหมด ${deptAnalysis.length} ภาควิชา`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ── Summary chips ── */}
                        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ภาพรวม:</span>
                            {insight.topProblems.slice(0, 3).map((p, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                    {p.label} {p.pct}%
                                </span>
                            ))}
                            {insight.topIncomes.sort((a,b) => b.count - a.count).slice(0, 1).map((inc, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                    รายได้ {inc.label} ({inc.pct}%)
                                </span>
                            ))}
                            {insight.highRiskCount > 0 && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100">
                                    <Users className="w-3 h-3 inline mr-1" />
                                    เสี่ยงสูง {insight.highRiskCount} ราย
                                </span>
                            )}
                            {deptAnalysis.filter(d => d.signal === "increase").length > 0 && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                    <ChevronUp className="w-3 h-3 inline mr-0.5" />
                                    เพิ่มงบ {deptAnalysis.filter(d => d.signal === "increase").length} สาขา
                                </span>
                            )}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
