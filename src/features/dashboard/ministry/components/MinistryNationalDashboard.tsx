// src/features/dashboard/ministry/components/MinistryNationalDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Executive Decision-Support Dashboard — Ministry Level
// ระบบช่วยตัดสินใจ + เตือนภัย สำหรับผู้บริหารกระทรวง
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { Shield, RefreshCw, Clock, Building2, Users, Calendar, CheckCircle2 } from "lucide-react";
import { ExecutiveKPIStrip } from "./executive/ExecutiveKPIStrip";
import { InsightPanel } from "./executive/InsightPanel";
import { AlertPanel } from "./executive/AlertPanel";
import { AreaFocusPanel } from "./executive/AreaFocusPanel";
import { RecommendationPanel } from "./executive/RecommendationPanel";
import { TrendForecastChart } from "./executive/TrendForecastChart";
import RegionalProblemDrillDown from "./RegionalProblemDrillDown";

const API = "/api/v2/dashboards/ministry/executive";

interface ExecData {
    summary: {
        totalUniversities: number;
        totalStudents: number;
        consultedStudents: number;
        totalBookings: number;
        completedBookings: number;
        noShowCount: number;
        highRiskCases: number;
        avgRiskScore: number;
        accessRate: number;
        successRate: number;
        noShowRate: number;
    };
    kpis: any[];
    insights: any[];
    alerts: any[];
    areaFocus: any[];
    recommendations: any[];
    trend: any[];
    dataRange: { minDate: string | null; maxDate: string | null };
    generatedAt: string;
    queryTimeMs: number;
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* KPI skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
                ))}
            </div>
            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80 bg-slate-100 rounded-2xl" />
                <div className="h-80 bg-slate-100 rounded-2xl" />
            </div>
            <div className="h-72 bg-slate-100 rounded-2xl" />
        </div>
    );
}

function SummaryBar({ summary }: { summary: ExecData["summary"] }) {
    const items = [
        { label: "มหาวิทยาลัย", value: summary.totalUniversities, suffix: "แห่ง", icon: <Building2 className="w-6 h-6" />, color: "text-blue-600 bg-blue-50 border-blue-100" },
        { label: "นิสิตทั้งหมด", value: summary.totalStudents, suffix: "คน", icon: <Users className="w-6 h-6" />, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
        { label: "การนัดหมาย", value: summary.totalBookings, suffix: "ครั้ง", icon: <Calendar className="w-6 h-6" />, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { label: "สำเร็จ", value: summary.completedBookings, suffix: "ครั้ง", icon: <CheckCircle2 className="w-6 h-6" />, color: "text-teal-600 bg-teal-50 border-teal-100" },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                        {item.icon}
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-0.5">{item.label}</p>
                        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 mt-0.5">
                            <span className="text-lg lg:text-xl font-black text-slate-800 tracking-tight break-all">
                                {item.value.toLocaleString()}
                            </span>
                            <span className="text-xs font-medium text-slate-400 shrink-0">{item.suffix}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function MinistryNationalDashboard() {
    const [data, setData] = useState<ExecData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(API, { credentials: "include" });
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                setLastRefresh(new Date());
            } else {
                setError(json.error || "Failed to load");
            }
        } catch (err) {
            setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <div className="min-h-screen">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .fade-up { animation: fadeUp 0.5s ease-out both; }
            `}</style>

            <div className="space-y-6">
                {/* ── Header ─────────────────────────────────────────── */}
                <div className="fade-up flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <div className="w-2 h-10 rounded-full bg-gradient-to-b from-rose-500 to-red-600" />
                            <div>
                                <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                                    ศูนย์บัญชาการกระทรวง
                                </h1>
                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                    <Shield className="w-3 h-3" />
                                    ระบบช่วยตัดสินใจ + เตือนภัยระดับประเทศ
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {lastRefresh && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lastRefresh.toLocaleTimeString("th-TH")}
                            </span>
                        )}
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all group"
                            title="รีเฟรช"
                        >
                            <RefreshCw className={`w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* ── Content ────────────────────────────────────────── */}
                {error ? (
                    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-8 text-center">
                        <p className="text-rose-700 font-medium">{error}</p>
                        <button
                            onClick={fetchData}
                            className="mt-3 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors"
                        >
                            ลองใหม่
                        </button>
                    </div>
                ) : loading || !data ? (
                    <LoadingSkeleton />
                ) : (
                    <>
                        {/* Summary bar */}
                        <div className="fade-up" style={{ animationDelay: "50ms" }}>
                            <SummaryBar summary={data.summary} />
                        </div>

                        {/* KPI Strip */}
                        <div className="fade-up" style={{ animationDelay: "100ms" }}>
                            <ExecutiveKPIStrip kpis={data.kpis} />
                        </div>

                        {/* Row 2: Insights + Alerts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-up" style={{ animationDelay: "200ms" }}>
                            <InsightPanel insights={data.insights} />
                            <AlertPanel alerts={data.alerts} />
                        </div>

                        {/* Row 3: Trend Chart */}
                        <div className="fade-up" style={{ animationDelay: "300ms" }}>
                            <TrendForecastChart trend={data.trend} />
                        </div>

                        {/* Row 4: Area Focus + Recommendations */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-up" style={{ animationDelay: "400ms" }}>
                            <AreaFocusPanel areas={data.areaFocus} />
                            <RecommendationPanel recommendations={data.recommendations} />
                        </div>

                        {/* Row 5: Regional Drill-Down (existing) */}
                        <div className="fade-up" style={{ animationDelay: "500ms" }}>
                            <RegionalProblemDrillDown delay={0} />
                        </div>

                        {/* Footer */}
                        <div className="text-center text-xs text-slate-300 py-3 fade-up" style={{ animationDelay: "600ms" }}>
                            อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                            {data.queryTimeMs && (
                                <span className="ml-2 text-slate-200">({data.queryTimeMs}ms)</span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
