// src/features/dashboard/ministry/components/MinistryNationalDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Story-based ministry dashboard — 4 story cards with per-card filters
// Each card owns its own: state, API call, date filter, chip filters
// Data scope: National (all universities)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";
import GenericStudentStory from "../../shared/GenericStudentStory";
import GenericBookingStory from "../../shared/GenericBookingStory";
import GenericProblemStory from "../../shared/GenericProblemStory";
import GenericRiskStory from "../../shared/GenericRiskStory";
import GenericIncomeChart from "../../shared/GenericIncomeChart";

const API = "/api/v2/dashboards/ministry/story";

export function MinistryNationalDashboard() {
    const [scope, setScope] = useState<{
        label: string; totalUniversities: number;
    } | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}?story=students&all_time=true`, { credentials: "include" });
                const json = await res.json();
                if (json.data?.scope) setScope(json.data.scope);
            } catch { /* silent */ }
        })();
    }, []);

    return (
        <div className="min-h-screen">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="space-y-5">
                {/* Header */}
                <div className="animate-[fadeUp_0.5s_ease-out_both]">
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-2 h-9 rounded-full bg-gradient-to-b from-rose-500 to-red-600" />
                        <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            แผงควบคุมกระทรวง
                        </h1>
                    </div>
                    {scope && (
                        <p className="text-sm text-slate-400 ml-4">
                            <span className="font-semibold text-rose-600">{scope.label}</span>
                            {" — "}{scope.totalUniversities} มหาวิทยาลัย
                        </p>
                    )}
                </div>

                {/* Row 1: Overview + Bookings (2 cols) */}
                <DataStoryGrid cols={2}>
                    <GenericStudentStory apiPath={API} title="ภาพรวมนิสิตระดับชาติ" delay={0}
                        description="จำนวนนิสิตทั้งหมดในระบบ แยกตามอัตราการเข้าใช้บริการ ใช้ประเมินการเข้าถึงระบบสุขภาวะในระดับชาติ" />
                    <GenericBookingStory apiPath={API} title="การใช้บริการระดับชาติ" delay={1}
                        description="ภาพรวมการนัดหมายและอัตราความสำเร็จในการรับบริการทั่วประเทศ — ติดตามแนวโน้มและประสิทธิภาพของระบบ" />
                </DataStoryGrid>

                {/* Row 2: Problems + Profile (full width) */}
                <GenericProblemStory apiPath={API} title="ประเด็นปัญหา + โปรไฟล์นิสิตระดับชาติ" delay={2}
                    description="ประเภทปัญหาที่นิสิตทั่วประเทศนำเข้ามาขอรับบริการ พร้อมโปรไฟล์กลุ่มรายได้และสถานะครอบครัว — ใช้วางนโยบายสนับสนุนนิสิตเปราะบาง" />

                {/* Row 3: Risk (full width) */}
                <GenericRiskStory apiPath={API} title="ระดับความเสี่ยงระดับชาติ" delay={3}
                    description="การกระจายระดับความเสี่ยง 5 ระดับของนิสิตทั่วประเทศ — ใช้จัดสรรงบประมาณและกำหนดนโยบายสุขภาพจิตระดับชาติ" />

                {/* Row 4: Income Distribution (full width) */}
                <GenericIncomeChart apiPath={API} title="โครงสร้างรายได้ครอบครัวนิสิตระดับชาติ" delay={4} />

                {/* Footer */}
                <div className="text-center text-xs text-slate-300 py-3 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "400ms" }}>
                    อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                </div>
            </div>
        </div>
    );
}
