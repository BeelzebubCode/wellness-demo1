// src/features/dashboard/rector/components/RectorDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Rector dashboard — University-wide view with faculty drill-down
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";
import GenericBookingStory from "../../shared/GenericBookingStory";
import GenericProblemStory from "../../shared/GenericProblemStory";
import GenericRiskStory from "../../shared/GenericRiskStory";
import FacultyConsultationChart from "./sections/FacultyConsultationChart";
import StaffUtilizationDonut from "./sections/StaffUtilizationDonut";
import PolicySummaryCard from "./sections/PolicySummaryCard";

const API = "/api/v2/dashboards/rector/story";

export function RectorDashboard() {
    const [university, setUniversity] = useState<{
        nameTh: string; code: string;
    } | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}?story=students&all_time=true`, { credentials: "include" });
                const json = await res.json();
                if (json.data?.university) setUniversity(json.data.university);
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
                        <div className="w-2 h-9 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600" />
                        <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            แผงควบคุมอธิการบดี
                        </h1>
                    </div>
                    {university && (
                        <p className="text-sm text-slate-400 ml-4">
                            <span className="font-semibold text-purple-600">{university.nameTh}</span>
                            {" — "}ภาพรวมทั้งมหาวิทยาลัย
                        </p>
                    )}
                </div>

                {/* ★ Hero: Faculty-level consultation chart */}
                <FacultyConsultationChart />

                {/* Row 1: Staff Utilization + Policy Summary */}
                <DataStoryGrid cols={2}>
                    <StaffUtilizationDonut />
                    <PolicySummaryCard />
                </DataStoryGrid>

                {/* Row 2: Bookings + Risk */}
                <DataStoryGrid cols={2}>
                    <GenericBookingStory apiPath={API} title="การใช้บริการทั้งมหาวิทยาลัย" delay={2} />
                    <GenericRiskStory apiPath={API} title="ระดับความเสี่ยงทั้งมหาวิทยาลัย" delay={3} />
                </DataStoryGrid>

                {/* Row 3: Problems + Profile */}
                <GenericProblemStory apiPath={API} title="ประเด็นปัญหา + โปรไฟล์นิสิตทั้งมหาวิทยาลัย" delay={4} />

                {/* Footer */}
                <div className="text-center text-xs text-slate-300 py-3 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "400ms" }}>
                    อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                </div>
            </div>
        </div>
    );
}
