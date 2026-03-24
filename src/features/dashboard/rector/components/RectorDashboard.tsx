"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Building2, LayoutDashboard, BarChart3 } from "lucide-react";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";
import RectorStatsCards from "./sections/RectorStatsCards";

const FacultyConsultationChart = dynamic(
    () => import("./sections/FacultyConsultationChart"),
    {
        loading: () => <div className="h-[480px] bg-slate-50 animate-pulse rounded-2xl" />,
        ssr: false,
    }
);
const StaffUtilizationDonut = dynamic(
    () => import("./sections/StaffUtilizationDonut"),
    {
        loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-2xl" />,
        ssr: false,
    }
);
const PolicySummaryCard = dynamic(
    () => import("./sections/PolicySummaryCard"),
    {
        loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-2xl" />,
        ssr: false,
    }
);
const RectorBookingSection = dynamic(
    () => import("./sections/RectorBookingSection"),
    {
        loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-2xl" />,
        ssr: false,
    }
);
const RectorRiskSection = dynamic(
    () => import("./sections/RectorRiskSection"),
    {
        loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-2xl" />,
        ssr: false,
    }
);
const RectorProblemSection = dynamic(
    () => import("./sections/RectorProblemSection"),
    {
        loading: () => <div className="h-[500px] bg-slate-50 animate-pulse rounded-2xl" />,
        ssr: false,
    }
);
const GenericIncomeChart = dynamic(
    () => import("../../shared/GenericIncomeChart"),
    {
        loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-2xl" />,
        ssr: false,
    }
);
const GenericParentalStatusChart = dynamic(
    () => import("../../shared/GenericParentalStatusChart"),
    {
        loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-2xl" />,
        ssr: false,
    }
);

const API = "/api/v2/dashboards/rector/story";

export function RectorDashboard() {
    const [universityName, setUniversityName] = useState<string>("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}?story=students&all_time=true`, { credentials: "include" });
                const json = await res.json();
                if (json.data?.university?.nameTh) setUniversityName(json.data.university.nameTh);
            } catch { /* silent */ }
        })();
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* ── Banner ────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0f172a] p-8 text-white shadow-2xl mb-8">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-600/5 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-white/20">
                            <Building2 className="h-10 w-10 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">แผงควบคุมอธิการบดี</h1>
                            <div className="flex flex-wrap items-center gap-3 text-white/60 text-sm font-bold uppercase tracking-widest">
                                {universityName ? (
                                    <span className="text-purple-300 normal-case text-sm font-semibold">{universityName}</span>
                                ) : (
                                    <span className="animate-pulse">กำลังโหลด...</span>
                                )}
                                <span className="h-1 w-1 rounded-full bg-purple-400/40" />
                                <span className="text-purple-400">Rector Strategy Dashboard</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 self-stretch md:self-auto">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-1 opacity-70">สถานะปัจจุบัน</p>
                            <div className="text-sm font-bold flex items-center gap-2 justify-end">
                                อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })} เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md rounded-full px-4 py-2 border border-emerald-500/20">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-black text-emerald-400">สิทธิ์อธิการบดีปกติ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 0: KPI Stats ──────────────────────────────── */}
            <section>
                <div className="mb-3 flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-purple-500" />
                    <h3 className="text-lg font-black text-slate-800">ภาพรวมสถิติ</h3>
                    <span className="text-xs text-slate-400 font-medium">— มีตัวกรองช่วงเวลาของตัวเอง</span>
                </div>
                <RectorStatsCards />
            </section>

            {/* ── Data Stories Header ───────────────────────────────── */}
            <div className="pt-2">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-1">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    Data Stories
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                    แต่ละการ์ดกรองข้อมูลได้อิสระ — กดปุ่ม <strong className="text-slate-500">ตัวกรอง</strong> ที่มุมขวาบนของแต่ละการ์ด
                </p>
            </div>

            {/* ── Section 1: Faculty Comparison ─────────────────────── */}
            <FacultyConsultationChart />

            {/* ── Section 2: Risk + Booking ─────────────────────────── */}
            <DataStoryGrid cols={2}>
                <RectorRiskSection apiPath={API} title="ระดับความเสี่ยงทั้งมหาวิทยาลัย" delay={2} />
                <RectorBookingSection apiPath={API} title="การใช้บริการทั้งมหาวิทยาลัย" delay={3} />
            </DataStoryGrid>

            {/* ── Section 3: Problem + Policy + Staff ───────────────── */}
            <DataStoryGrid cols={2}>
                <RectorProblemSection apiPath={API} title="ประเด็นปัญหา + โปรไฟล์นิสิต" delay={4} />
                <div className="flex flex-col gap-6">
                    <StaffUtilizationDonut />
                    <PolicySummaryCard />
                </div>
            </DataStoryGrid>

            {/* ── Section 4: Income Distribution ────────────────────── */}
            <GenericIncomeChart apiPath={API} title="โครงสร้างรายได้ครอบครัวนิสิตทั้งมหาวิทยาลัย" delay={5} />
            <GenericParentalStatusChart apiPath={API} title="สถานะบิดามารดานิสิตทั้งมหาวิทยาลัย" delay={6} />

            {/* ── Footer ────────────────────────────────────────────── */}
            <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-500">รายงานระดับผู้บริหารมหาวิทยาลัย</span>
                    <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>ข้อมูล ณ {new Date().toLocaleDateString("th-TH")}</span>
                </div>
                <span className="px-2 py-1 bg-slate-100 rounded text-slate-500 font-mono text-[10px] uppercase tracking-widest font-bold">Confidential</span>
            </div>
        </div>
    );
}
