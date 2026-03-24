"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Building2, LayoutDashboard, BarChart3 } from "lucide-react";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";

import GenericBookingStory from "../../shared/GenericBookingStory";
import GenericProblemStory from "../../shared/GenericProblemStory";
import GenericRiskStory from "../../shared/GenericRiskStory";
import GenericIncomeChart from "../../shared/GenericIncomeChart";
import GenericParentalStatusChart from "../../shared/GenericParentalStatusChart";
import { RectorInsightPanel } from "./RectorInsightPanel";

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
        <div className="relative min-h-screen bg-white text-slate-900 overflow-hidden pb-12 transition-colors duration-1000">
            {/* Subtle Ambient Backgrounds */}
            <div className="absolute top-0 w-full h-[800px] bg-gradient-to-b from-slate-50 to-transparent pointer-events-none" />

            {/* Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
                {/* ── Banner ─────────────────────────── */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-xl mb-8 border border-purple-900/30">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-white/20">
                                <Building2 className="h-10 w-10 text-purple-400" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight mb-2">
                                    ภาพรวมการเข้ารับการปรึกษาจิตแพทย์ของนิสิต
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-white/60 text-sm font-bold uppercase tracking-widest">
                                    <span>{universityName || "กำลังโหลด..."}</span>
                                    <span className="h-1 w-1 rounded-full bg-purple-500/50" />
                                    <span className="text-purple-300">Rector Strategy Dashboard</span>
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

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

                    {/* ── AI Insight Panel ─────────────────── */}
                    <RectorInsightPanel />

                    {/* ── Section 0: KPI Stats ─────────────────────── */}
                    <section>
                        <div className="mb-3 flex items-center gap-2">
                            <LayoutDashboard className="h-5 w-5 text-purple-500" />
                            <h3 className="text-xl font-black text-slate-800">ภาพรวมสถิติ</h3>
                            <span className="text-xs text-slate-400 font-medium ml-2 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">— มีตัวกรองช่วงเวลาของตัวเอง</span>
                        </div>
                        <RectorStatsCards />
                    </section>

                    <div className="pt-4">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-1">
                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                            Data Stories (ภาพรวมมหาวิทยาลัย)
                        </h3>
                        <p className="text-xs text-slate-400 mb-6">
                            แต่ละการ์ดกรองข้อมูลได้อิสระ — กดปุ่ม <strong className="text-slate-500">ตัวกรอง</strong> ที่มุมขวาบนของแต่ละการ์ดเพื่อกรองตามช่วงสอบและอื่นๆ
                        </p>
                    </div>

                    {/* ── Section 1: Faculty Comparison ─────────────────────── */}
                    <FacultyConsultationChart />

                    {/* ── Section 2: Bookings + Risk ────────────────── */}
                    <DataStoryGrid cols={2}>
                        <GenericBookingStory apiPath={API} title="การใช้บริการระดับมหาวิทยาลัย" delay={1}
                            description="ติดตามจำนวนการนัดหมายและอัตราสำเร็จ — เพื่อวิเคราะห์แนวโน้มและวางแผนอัตรากำลังบุคลากรส่วนกลาง" />
                        <GenericRiskStory apiPath={API} title="ระดับความเสี่ยงระดับมหาวิทยาลัย" delay={2}
                            description="สัดส่วนนิสิตที่วิกฤต/เสี่ยงสูงทั่วทั้งมหาวิทยาลัย — เพื่อกำหนดนโยบายเฝ้าระวังแบบองค์รวม" />
                    </DataStoryGrid>

                    {/* ── Section 3: Problem + Policy + Staff ───────────────── */}
                    <DataStoryGrid cols={2}>
                        <GenericProblemStory apiPath={API} title="ประเด็นปัญหา + โปรไฟล์นิสิตรระดับมหาวิทยาลัย" delay={3}
                            description="ปัญหายอดฮิตที่นิสิตปรึกษา — ใช้วางมาตรการเชิงนโยบายและสวัสดิการภาพรวม" />
                        <div className="flex flex-col gap-6">
                            <StaffUtilizationDonut />
                            <PolicySummaryCard />
                        </div>
                    </DataStoryGrid>

                    {/* ── Section 4: Income Distribution ────────────────────── */}
                    <GenericIncomeChart apiPath={API} title="โครงสร้างรายได้ครอบครัวนิสิตภาพรวม" delay={5} />
                    <GenericParentalStatusChart apiPath={API} title="สถานะบิดามารดานิสิตภาพรวม" delay={6} />
                </div>

                {/* ── Footer ─────────────────────────── */}
                <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 pb-8">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-500">รายงานระดับผู้บริหารมหาวิทยาลัย</span>
                        <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span>ข้อมูล ณ {new Date().toLocaleDateString("th-TH")}</span>
                    </div>
                    <span className="px-2 py-1 bg-white rounded-md shadow-sm border border-slate-200 text-slate-500 font-mono text-[10px] uppercase tracking-widest font-bold">Confidential</span>
                </div>
            </div>
        </div>
    );
}
