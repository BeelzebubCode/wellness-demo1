// src/features/dashboard/dean/components/DeanDashboard.tsx
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";
import GenericBookingStory from "../../shared/GenericBookingStory";
import GenericProblemStory from "../../shared/GenericProblemStory";
import GenericRiskStory from "../../shared/GenericRiskStory";
import GenericIncomeChart from "../../shared/GenericIncomeChart";
import DepartmentConsultationChart from "./sections/DepartmentConsultationChart";
import { Building2, LayoutDashboard } from "lucide-react";

const DeanStatsCards = dynamic(
    () => import("./DeanStatsCards"),
    {
        loading: () => (
            <div className="space-y-3">
                <div className="flex gap-2">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="h-8 w-20 bg-slate-100 animate-pulse rounded-lg" />
                    ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-[2rem]" />
                    ))}
                </div>
            </div>
        ),
        ssr: false,
    }
);

const API = "/api/v2/dashboards/dean/story";

export function DeanDashboard() {
    const [faculty, setFaculty] = useState<{
        nameTh: string; universityNameTh: string;
    } | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}?story=students&all_time=true`, { credentials: "include" });
                const json = await res.json();
                if (json.data?.faculty) setFaculty(json.data.faculty);
            } catch { /* silent */ }
        })();
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* ── Banner ─────────────────────────── */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0f172a] p-8 text-white shadow-2xl mb-8">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-600/5 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-white/20">
                            <Building2 className="h-10 w-10 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">
                                แผงควบคุมคณบดี
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-white/60 text-sm font-bold uppercase tracking-widest">
                                <span>{faculty?.universityNameTh || "กำลังโหลด..."}</span>
                                <span className="h-1 w-1 rounded-full bg-cyan-500/40" />
                                <span className="text-cyan-400">{faculty?.nameTh || "กำลังโหลด..."}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 self-stretch md:self-auto">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-1 opacity-70">สถานะปัจจุบัน</p>
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
                                <span className="text-xs font-black text-emerald-400">สิทธิ์คณบดีปกติ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

                {/* ── Section 0: KPI Stats ─────────────────────── */}
                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4 text-cyan-500" />
                        <h3 className="text-lg font-black text-slate-800">ภาพรวมสถิติ</h3>
                        <span className="text-xs text-slate-400 font-medium">— มีตัวกรองช่วงเวลาของตัวเอง</span>
                    </div>
                    <DeanStatsCards />
                </section>

                {/* ★ Hero: Department-level consultation chart — full width */}
                <DepartmentConsultationChart />

                {/* ── Grid Row 1: Bookings + Risk ────────────────── */}
                <DataStoryGrid cols={2}>
                    <GenericBookingStory apiPath={API} title="ประวัติการใช้บริการในคณะ" delay={1}
                        description="ติดตามจำนวนการนัดหมาย อัตราสำเร็จ และแนวโน้มรายปีหรือรายเดือนในคณะ — ใช้ประเมินความหนาแน่นและวางแผนจัดสรรอัตรากำลังบุคลากร" />
                    <GenericRiskStory apiPath={API} title="ระดับความเสี่ยงในคณะ" delay={2}
                        description="สัดส่วนนิสิตที่ประเมินแล้วตกอยู่ในเกณฑ์เสี่ยงแต่ละระดับ — เพื่อเน้นช่วยเหลือกลุ่มเปราะบาง (วิกฤต/เสี่ยงสูง) ก่อนและลดความสูญเสียในระดับคณะ" />
                </DataStoryGrid>

                {/* ── Grid Row 2: Problems (full width) ─────────────────── */}
                <GenericProblemStory apiPath={API} title="ประเด็นปัญหา + โปรไฟล์นิสิตในคณะ" delay={3}
                    description="ประเภทปัญหาที่นิสิตในคณะนำเข้ามาปรึกษากับส่วนกลาง — ใช้วางแผนจัดกิจกรรมสันทนาการ โครงการ หรือ workshop ภายในคณะได้ตรงประเด็นความเครียด" />

                {/* ── Grid Row 3: Income Distribution (full width) ──────────── */}
                <GenericIncomeChart apiPath={API} title="รายได้ครอบครัวนิสิตในคณะ" delay={4} />
            </div>

            {/* ── Footer ─────────────────────────── */}
            <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-500">รายงานสำหรับระดับผู้บริหารคณะ</span>
                    <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>อ้างอิงข้อมูล ณ {new Date().toLocaleDateString('th-TH')}</span>
                </div>
                <span className="px-2 py-1 bg-slate-100 rounded text-slate-500 font-mono text-[10px] uppercase tracking-widest font-bold">Confidential</span>
            </div>
        </div>
    );
}
