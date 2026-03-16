// src/features/dashboard/advisor/components/AdvisorDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Story-based advisor dashboard — 4 story cards
// Data scope: Advisor's own advisees only
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";
import GenericStudentStory from "../../shared/GenericStudentStory";
import GenericBookingStory from "../../shared/GenericBookingStory";
import GenericProblemStory from "../../shared/GenericProblemStory";
import GenericRiskStory from "../../shared/GenericRiskStory";

const API = "/api/v2/dashboards/advisor";

export function AdvisorDashboard() {
    const [advisor, setAdvisor] = useState<{
        username: string;
    } | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}?story=students&all_time=true`, { credentials: "include" });
                const json = await res.json();
                if (json.data?.advisor) setAdvisor(json.data.advisor);
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
                        <div className="w-2 h-9 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
                        <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            แผงควบคุมอาจารย์ที่ปรึกษา
                        </h1>
                    </div>
                    {advisor && (
                        <p className="text-sm text-slate-400 ml-4">
                            <span className="font-semibold text-teal-600">{advisor.username}</span>
                            {" — "}นิสิตในที่ปรึกษา
                        </p>
                    )}
                </div>

                {/* Row 1: Overview + Bookings */}
                <DataStoryGrid cols={2}>
                    <GenericStudentStory apiPath={API} title="ภาพรวมนิสิตในที่ปรึกษา" delay={0} />
                    <GenericBookingStory apiPath={API} title="การใช้บริการของนิสิต" delay={1} />
                </DataStoryGrid>

                {/* Row 2: Problems + Profile */}
                <GenericProblemStory apiPath={API} title="ประเด็นปัญหา + โปรไฟล์นิสิต" delay={2} />

                {/* Row 3: Risk */}
                <GenericRiskStory apiPath={API} title="ระดับความเสี่ยงนิสิตในที่ปรึกษา" delay={3} />

                {/* Footer */}
                <div className="text-center text-xs text-slate-300 py-3 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "400ms" }}>
                    อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                </div>
            </div>
        </div>
    );
}
