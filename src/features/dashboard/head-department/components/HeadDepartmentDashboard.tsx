// src/features/dashboard/head-department/components/HeadDepartmentDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { DashboardFilterBar } from "../../widgets/filters/DashboardFilterBar";
import type { AnalyticsParams } from "../../widgets/types/analytics-types";

// ─── Types ──────────────────────────────────────────────────────────────────
interface DeptDashData {
    department: {
        nameTh: string; nameEn: string; code: string;
        facultyNameTh: string; universityNameTh: string;
    };
    summary: {
        totalStudents: number; totalBookings: number;
        checkedInCount: number; noShowCount: number;
        completedCount: number; highRiskCount: number;
    };
    riskDistribution: { label: string; count: number }[];
    incomeDist: { label: string; count: number }[];
    bloodDist: { label: string; count: number }[];
    parentalDist: { label: string; count: number }[];
    birthDist: { label: string; count: number }[];
    chronicDist: { label: string; code: string; count: number }[];
    problemCategories: { label: string; count: number }[];
    monthlyTrend: { month: string; bookings: number; checkedIn: number }[];
}

// ─── Color Palettes ─────────────────────────────────────────────────────────
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
const BAR_GRADIENT_FROM = "#3b82f6";
const BAR_GRADIENT_TO = "#8b5cf6";

const INCOME_LABELS: Record<string, string> = {
    UNDER_100K: "< 100K",
    BETWEEN_100K_200K: "100-200K",
    BETWEEN_200K_300K: "200-300K",
    BETWEEN_300K_500K: "300-500K",
    BETWEEN_500K_800K: "500-800K",
    BETWEEN_800K_1M: "800K-1M",
    OVER_1M: "> 1M",
    UNKNOWN: "ไม่ระบุ",
};

const PARENTAL_LABELS: Record<string, string> = {
    TOGETHER: "พ่อแม่อยู่ด้วยกัน",
    DIVORCED: "หย่าร้าง",
    FATHER_DECEASED: "บิดาเสียชีวิต",
    MOTHER_DECEASED: "มารดาเสียชีวิต",
    BOTH_DECEASED: "เสียชีวิตทั้งคู่",
    SINGLE_PARENT: "เลี้ยงเดี่ยว",
    UNKNOWN: "ไม่ระบุ",
};

const BIRTH_LABELS: Record<string, string> = {
    ONLY_CHILD: "ลูกคนเดียว",
    FIRST: "บุตรคนที่ 1",
    SECOND: "บุตรคนที่ 2",
    THIRD: "บุตรคนที่ 3",
    FOURTH_PLUS: "บุตรคนที่ 4+",
    UNKNOWN: "ไม่ระบุ",
};

const RISK_COLORS: Record<string, string> = {
    HIGH: "#ef4444",
    MEDIUM: "#f59e0b",
    LOW: "#10b981",
    UNKNOWN: "#94a3b8",
};

// ─── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color }: {
    label: string; value: number; icon: string; color: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: "from-blue-50 to-blue-100/50 border-blue-200/60",
        emerald: "from-emerald-50 to-emerald-100/50 border-emerald-200/60",
        amber: "from-amber-50 to-amber-100/50 border-amber-200/60",
        rose: "from-rose-50 to-rose-100/50 border-rose-200/60",
        violet: "from-violet-50 to-violet-100/50 border-violet-200/60",
        cyan: "from-cyan-50 to-cyan-100/50 border-cyan-200/60",
    };
    return (
        <div className={`bg-gradient-to-br ${colorClasses[color] ?? colorClasses.blue} border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-500">{label}</span>
                <span className="text-2xl">{icon}</span>
            </div>
            <div className="text-3xl font-black text-slate-800 tabular-nums">
                {value.toLocaleString()}
            </div>
        </div>
    );
}

// ─── Chart Card ─────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, className }: {
    title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
    return (
        <div className={`bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-5 shadow-sm ${className ?? ""}`}>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5 mb-3">{subtitle}</p>}
            {!subtitle && <div className="h-3" />}
            {children}
        </div>
    );
}

// ─── Stat Skeleton ──────────────────────────────────────────────────────────
function StatSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-64 bg-slate-100 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
            <p className="font-semibold text-slate-700">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: <span className="font-bold">{p.value?.toLocaleString()}</span>
                </p>
            ))}
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function HeadDepartmentDashboard() {
    const [params, setParams] = useState<AnalyticsParams>(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        const lastDay = new Date(y, m, 0).getDate();
        return {
            date_start: `${y}-${String(m).padStart(2, "0")}-01`,
            date_end: `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
            all_time: true,
        };
    });
    const [data, setData] = useState<DeptDashData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const buildSearchParams = useCallback((p: AnalyticsParams) => {
        const sp = new URLSearchParams();
        if (p.all_time) sp.set("all_time", "true");
        else {
            if (p.date_start) sp.set("date_start", p.date_start);
            if (p.date_end) sp.set("date_end", p.date_end);
        }
        if (p.gender?.length) sp.set("gender", p.gender.join(","));
        if (p.problem_category_ids?.length) sp.set("problem_category_ids", p.problem_category_ids.join(","));
        if (p.service_mode?.length) sp.set("service_mode", p.service_mode.join(","));
        if (p.booking_status?.length) sp.set("booking_status", p.booking_status.join(","));
        if (p.attendance_status?.length) sp.set("attendance_status", p.attendance_status.join(","));
        if (p.family_income_bracket?.length) sp.set("family_income_bracket", p.family_income_bracket.join(","));
        if (p.blood_group?.length) sp.set("blood_group", p.blood_group.join(","));
        if (p.birth_order?.length) sp.set("birth_order", p.birth_order.join(","));
        if (p.chronic_condition_ids?.length) sp.set("chronic_condition_ids", p.chronic_condition_ids.join(","));
        if (p.parental_status?.length) sp.set("parental_status", p.parental_status.join(","));
        return sp;
    }, []);

    const fetchData = useCallback(async (p: AnalyticsParams) => {
        setLoading(true);
        setError(null);
        try {
            const sp = buildSearchParams(p);
            const res = await fetch(`/api/v2/dashboards/head-department?${sp.toString()}`, {
                credentials: "include",
                cache: "no-store",
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
            setData(json.data);
        } catch (e: any) {
            setError(e?.message ?? "เกิดข้อผิดพลาด");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [buildSearchParams]);

    const paramsKey = useMemo(() => JSON.stringify(params), [params]);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fetchData(params), 300);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [paramsKey, fetchData, params]);

    const updateParams = useCallback((patch: Partial<AnalyticsParams>) => {
        setParams(prev => ({ ...prev, ...patch }));
    }, []);

    // Mapped chart data
    const incomeData = useMemo(() =>
        (data?.incomeDist ?? []).map(d => ({ name: INCOME_LABELS[d.label] ?? d.label, count: d.count })),
        [data?.incomeDist]
    );
    const parentalData = useMemo(() =>
        (data?.parentalDist ?? []).map(d => ({ name: PARENTAL_LABELS[d.label] ?? d.label, count: d.count })),
        [data?.parentalDist]
    );
    const birthData = useMemo(() =>
        (data?.birthDist ?? []).map(d => ({ name: BIRTH_LABELS[d.label] ?? d.label, count: d.count })),
        [data?.birthDist]
    );
    const bloodData = useMemo(() =>
        (data?.bloodDist ?? []).map(d => ({ name: d.label, count: d.count })),
        [data?.bloodDist]
    );
    const riskData = useMemo(() =>
        (data?.riskDistribution ?? []).filter(d => d.label !== "UNKNOWN").map(d => ({
            name: d.label === "HIGH" ? "สูง" : d.label === "MEDIUM" ? "ปานกลาง" : "ต่ำ",
            count: d.count,
            fill: RISK_COLORS[d.label] ?? "#94a3b8",
        })),
        [data?.riskDistribution]
    );

    const s = data?.summary;

    return (
        <div className="space-y-6">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">
                    แผงควบคุมหัวหน้าภาควิชา
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    {data?.department
                        ? `${data.department.nameTh} — ${data.department.facultyNameTh} — ${data.department.universityNameTh}`
                        : "ข้อมูลเชิงลึกระดับภาควิชา — สุขภาวะนิสิตในสังกัด"
                    }
                </p>
            </div>

            {/* ── Filters ─────────────────────────────────────────────────── */}
            <DashboardFilterBar
                role="head-department"
                params={params}
                onChange={updateParams}
            />

            {/* ── Loading / Error ──────────────────────────────────────────── */}
            {loading && <StatSkeleton />}
            {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm font-semibold">
                    ❌ {error}
                </div>
            )}

            {!loading && data && (
                <>
                    {/* ── KPI Cards ──────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <KpiCard label="นิสิตในภาค" value={s?.totalStudents ?? 0} icon="🎓" color="cyan" />
                        <KpiCard label="การจองทั้งหมด" value={s?.totalBookings ?? 0} icon="📅" color="blue" />
                        <KpiCard label="เช็คอินสำเร็จ" value={s?.checkedInCount ?? 0} icon="✅" color="emerald" />
                        <KpiCard label="เสร็จสิ้น" value={s?.completedCount ?? 0} icon="🏁" color="violet" />
                        <KpiCard label="ไม่มา (No Show)" value={s?.noShowCount ?? 0} icon="⚠️" color="amber" />
                        <KpiCard label="ความเสี่ยงสูง" value={s?.highRiskCount ?? 0} icon="🛡️" color="rose" />
                    </div>

                    {/* ── Demographics Row (3 charts) ─────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Income Distribution */}
                        <ChartCard title="รายได้ครอบครัว" subtitle="การกระจายรายได้ครอบครัวนิสิต (บาท/ปี)">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={incomeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                    <XAxis type="number" tick={{ fontSize: 10 }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="จำนวน" fill={BAR_GRADIENT_FROM} radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Blood Group */}
                        <ChartCard title="กรุ๊ปเลือด" subtitle="การกระจายกรุ๊ปเลือดนิสิต">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={bloodData} dataKey="count" nameKey="name"
                                        cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {bloodData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Parental Status */}
                        <ChartCard title="สถานะครอบครัว" subtitle="สถานะผู้ปกครองของนิสิต">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={parentalData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                    <XAxis type="number" tick={{ fontSize: 10 }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="จำนวน" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* ── Row 2: Chronic + Birth Order + Risk ──────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Chronic Conditions */}
                        <ChartCard title="โรคประจำตัว" subtitle="จำนวนนิสิตที่มีโรคประจำตัว (เรียงมาก→น้อย)" className="lg:col-span-2">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={data.chronicDist} layout="vertical" margin={{ left: 10, right: 20 }}>
                                    <defs>
                                        <linearGradient id="chronicGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor={BAR_GRADIENT_FROM} />
                                            <stop offset="100%" stopColor={BAR_GRADIENT_TO} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis type="number" tick={{ fontSize: 10 }} />
                                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={100} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="จำนวน" fill="url(#chronicGrad)" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Birth Order + Risk */}
                        <div className="flex flex-col gap-4">
                            <ChartCard title="ลำดับบุตร" subtitle="ลูกคนเดียว vs บุตรคนที่...">
                                <ResponsiveContainer width="100%" height={115}>
                                    <PieChart>
                                        <Pie data={birthData} dataKey="count" nameKey="name"
                                            cx="50%" cy="50%" outerRadius={45} innerRadius={20}
                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {birthData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title="ความเสี่ยงนิสิต" subtitle="ระดับความเสี่ยง">
                                <div className="flex items-center gap-3">
                                    {riskData.map((r, i) => (
                                        <div key={i} className="flex-1 text-center">
                                            <div className="text-2xl font-black tabular-nums" style={{ color: r.fill }}>
                                                {r.count.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                                                {r.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ChartCard>
                        </div>
                    </div>

                    {/* ── Problem Categories ──────────────────────────────────── */}
                    {data.problemCategories.length > 0 && (
                        <ChartCard title="ภาพรวมประเด็นปัญหาทั้งหมด (Problem Landscape)" subtitle="จัดลำดับปัญหาตามจำนวนนิสิตที่เข้าใช้บริการ">
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={data.problemCategories} margin={{ left: 10, right: 20, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="จำนวน" fill="url(#probGrad)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    )}

                    {/* ── Monthly Trend ────────────────────────────────────────── */}
                    {data.monthlyTrend.length > 0 && (
                        <ChartCard title="แนวโน้มรายเดือน (12 เดือน)" subtitle="จำนวนการจองและการเช็คอิน">
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={data.monthlyTrend} margin={{ left: 10, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="bookings" name="การจอง"
                                        stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="checkedIn" name="เช็คอิน"
                                        stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    )}
                </>
            )}
        </div>
    );
}
