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
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0f172a] p-8 text-white shadow-2xl animate-[fadeUp_0.5s_ease-out_both]">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-600/5 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-xl">
                            <Building2 className="h-8 w-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">แผงควบคุมอธิการบดี</h1>
                            <div className="flex items-center gap-3 mt-1 text-white/50 text-xs font-bold uppercase tracking-widest">
                                {universityName ? (
                                    <span className="text-purple-300 normal-case text-sm font-semibold">{universityName}</span>
                                ) : (
                                    <span className="animate-pulse">กำลังโหลด...</span>
                                )}
                                <span className="h-1 w-1 rounded-full bg-purple-400/40" />
                                <span>Rector Strategy Dashboard</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right text-xs text-white/40 font-medium">
                            <div>{new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</div>
                            <div className="text-[10px] mt-0.5">{new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-500/10 rounded-full px-3 py-1.5 border border-emerald-500/20">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-400">Live</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 0: KPI Stats ──────────────────────────────── */}
            <section className="animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "60ms" }}>
                <div className="mb-3 flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-purple-500" />
                    <h3 className="text-base font-black text-slate-700">ภาพรวมสถิติ</h3>
                    <span className="text-xs text-slate-400 font-medium">— มีตัวกรองช่วงเวลาของตัวเอง</span>
                </div>
                <RectorStatsCards />
            </section>

            {/* ── Data Stories Header ───────────────────────────────── */}
            <div className="pt-2 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "100ms" }}>
                <h3 className="text-base font-black text-slate-700 flex items-center gap-2 mb-0.5">
                    <BarChart3 className="h-4 w-4 text-indigo-500" />
                    Data Stories
                </h3>
                <p className="text-xs text-slate-400">
                    แต่ละการ์ดกรองข้อมูลได้อิสระ — กดปุ่ม <strong className="text-slate-500">ตัวกรอง</strong> ที่มุมขวาบนของแต่ละการ์ด
                </p>
            </div>

            {/* ── Section 1: Faculty Comparison ─────────────────────── */}
            <div className="animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "150ms" }}>
                <FacultyConsultationChart />
            </div>

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

            {/* ── Footer ────────────────────────────────────────────── */}
            <div className="pt-8 border-t border-slate-100 flex justify-between items-center text-xs text-slate-300">
                <span>ระบบสุขภาวะนิสิต — ข้อมูล ณ {new Date().toLocaleDateString("th-TH")}</span>
                <span className="px-2 py-1 bg-slate-50 rounded text-slate-400 font-mono font-bold uppercase tracking-widest text-[10px]">Confidential</span>
            </div>
        </div>
    );
}
