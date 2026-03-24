// src/features/dashboard/head-department/components/HeadDepartmentDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Slim orchestrator — 4 story cards: Students, Bookings, Problems+Profile, Risk
// Each card owns its own: state, API call, date filter, chip filters
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { BookOpen, LayoutDashboard, BarChart3, ShieldAlert, AlertTriangle } from "lucide-react";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";

import StudentOverviewStory from "./StudentOverviewStory";
import BookingStory from "./BookingStory";
import ProblemStory from "./ProblemStory";
import RiskStory from "./RiskStory";
import RecommendationCard from "./RecommendationCard";

const HeadDeptStatsCards = dynamic(() => import("./HeadDeptStatsCards"), {
    loading: () => <div className="h-40 bg-slate-50 animate-pulse rounded-2xl" />,
    ssr: false,
});

const GenericIncomeChart = dynamic(() => import("../../shared/GenericIncomeChart"), {
    loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-2xl" />,
    ssr: false,
});

const GenericParentalStatusChart = dynamic(() => import("../../shared/GenericParentalStatusChart"), {
    loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-2xl" />,
    ssr: false,
});


interface DeptMeta {
    nameTh: string;
    facultyNameTh: string;
    universityNameTh: string;
}

export default function HeadDepartmentDashboard() {
    const [dept, setDept] = useState<DeptMeta | null>(null);
    const [highRiskCount, setHighRiskCount] = useState<number>(0);
    const [alertLoaded, setAlertLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/v2/dashboards/head-department?story=all&all_time=true", {
                    credentials: "include",
                });
                const json = await res.json();
                if (json.data?.department) setDept(json.data.department);
                setHighRiskCount(json.data?.risk?.highRiskCount ?? 0);
            } catch { /* silent */ } finally {
                setAlertLoaded(true);
            }
        })();
    }, []);

    const hasAlerts = alertLoaded && highRiskCount > 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* ── Banner ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0f172a] p-8 text-white shadow-2xl">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-violet-600/5 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-white/20">
                            <BookOpen className="h-10 w-10 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">แผงควบคุมหัวหน้าภาควิชา</h1>
                            <div className="flex flex-wrap items-center gap-3 text-white/60 text-sm font-bold uppercase tracking-widest">
                                {dept ? (
                                    <span className="text-indigo-300 normal-case text-sm font-semibold">
                                        {dept.nameTh} — {dept.facultyNameTh} — {dept.universityNameTh}
                                    </span>
                                ) : (
                                    <span className="animate-pulse text-white/40 normal-case font-normal">กำลังโหลด...</span>
                                )}
                                <span className="h-1 w-1 rounded-full bg-indigo-400/40" />
                                <span className="text-indigo-400">Head Department Portal</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 self-stretch md:self-auto">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1 opacity-70">สถานะปัจจุบัน</p>
                            <div className="text-sm font-bold flex items-center gap-2 justify-end">
                                อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })} เวลา {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md rounded-full px-4 py-2 border border-emerald-500/20">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-black text-emerald-400">สิทธิ์หัวหน้าภาควิชา</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Alert Bar (เฉพาะเมื่อมีนิสิตเสี่ยงสูง) ────────────── */}
            {hasAlerts && (
                <div className="animate-[fadeUp_0.4s_ease-out_both]">
                    <div className="bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border border-red-200/60 rounded-2xl px-5 py-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-black text-red-700 uppercase tracking-wider">ต้องดำเนินการ — นิสิตในภาควิชารอการติดตาม</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {highRiskCount > 0 && (
                                <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-xl px-4 py-2.5 border border-red-200/50 shadow-sm">
                                    <ShieldAlert className="w-4 h-4 text-red-500" />
                                    <div>
                                        <span className="text-lg font-black text-red-600 tabular-nums">{highRiskCount}</span>
                                        <span className="text-[11px] text-red-500 ml-1.5 font-bold">นิสิตวิกฤต / เสี่ยงสูง ในภาควิชา</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-xl px-4 py-2.5 border border-orange-200/50 shadow-sm">
                                <AlertTriangle className="w-4 h-4 text-orange-400" />
                                <span className="text-[11px] text-orange-600 font-bold">กรุณาติดตามนิสิตกลุ่มนี้โดยเร็ว</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Section: KPI Stats ─────────────────────────────────── */}
            <section>
                <div className="mb-3 flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                    <h3 className="text-lg font-black text-slate-800">ภาพรวมสถิติ</h3>
                    <span className="text-xs text-slate-400 font-medium">— มีตัวกรองช่วงเวลาของตัวเอง</span>
                </div>
                <HeadDeptStatsCards />
            </section>

            {/* ── Data Stories Header ────────────────────────────────── */}
            <div className="pt-2">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-1">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    Data Stories
                </h3>
                <p className="text-xs text-slate-400 mb-2">
                    แต่ละการ์ดกรองข้อมูลได้อิสระ — กดปุ่ม <strong className="text-slate-500">ตัวกรอง</strong> ที่มุมขวาบนของแต่ละการ์ด
                </p>
            </div>

            {/* Row 1: Overview + Bookings (2 cols) */}
            <DataStoryGrid cols={2}>
                <StudentOverviewStory delay={0} />
                <BookingStory delay={1} />
            </DataStoryGrid>

            {/* Row 2: Problems + Profile (full width — the star card) */}
            <ProblemStory delay={2} />

            {/* Row 3: Risk (full width) */}
            <RiskStory delay={3} />

            {/* Row 4: Income Distribution */}
            <GenericIncomeChart apiPath="/api/v2/dashboards/head-department" title="รายได้ครอบครัวนิสิตในภาควิชา" delay={4} />
            <GenericParentalStatusChart apiPath="/api/v2/dashboards/head-department" title="สถานะบิดามารดานิสิตในภาควิชา" delay={5} />

            {/* Row 5: Recommendations */}
            <RecommendationCard delay={6} />

            {/* ── Footer ────────────────────────────────────────────── */}
            <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-500">รายงานระดับหัวหน้าภาควิชา</span>
                    <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full" />
                    <span>ข้อมูล ณ {new Date().toLocaleDateString("th-TH")}</span>
                </div>
                <span className="px-2 py-1 bg-slate-100 rounded text-slate-500 font-mono text-[10px] uppercase tracking-widest font-bold">Confidential</span>
            </div>
        </div>
    );
}
