// src/features/dashboard/dean/components/DeanDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Story-based dean dashboard — 4 story cards (same pattern as Head Department)
// Data scope: Faculty (all departments)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";
import GenericStudentStory from "../../shared/GenericStudentStory";
import GenericBookingStory from "../../shared/GenericBookingStory";
import GenericProblemStory from "../../shared/GenericProblemStory";
import GenericRiskStory from "../../shared/GenericRiskStory";

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
                        <div className="w-2 h-9 rounded-full bg-gradient-to-b from-cyan-500 to-blue-600" />
                        <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            แผงควบคุมคณะบดี
                        </h1>
                    </div>
                    {faculty && (
                        <p className="text-sm text-slate-400 ml-4">
                            <span className="font-semibold text-cyan-600">{faculty.nameTh}</span>
                            {" — "}{faculty.universityNameTh}
                        </p>
                    )}
                </div>

                {/* Row 1: Overview + Bookings */}
                <DataStoryGrid cols={2}>
                    <GenericStudentStory apiPath={API} title="ภาพรวมนิสิตในคณะ" delay={0} />
                    <GenericBookingStory apiPath={API} title="การใช้บริการในคณะ" delay={1} />
                </DataStoryGrid>

                {/* Row 2: Problems + Profile (full width) */}
                <GenericProblemStory apiPath={API} title="ประเด็นปัญหา + โปรไฟล์นิสิตในคณะ" delay={2} />

                {/* Row 3: Risk */}
                <GenericRiskStory apiPath={API} title="ระดับความเสี่ยงในคณะ" delay={3} />

                {/* Footer */}
                <div className="text-center text-xs text-slate-300 py-3 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "400ms" }}>
                    อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                </div>
            </div>
        </div>
    );
}
