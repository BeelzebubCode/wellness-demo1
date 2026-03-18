// src/features/dashboard/head-department/components/HeadDepartmentDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Slim orchestrator — 4 story cards: Students, Bookings, Problems+Profile, Risk
// Each card owns its own: state, API call, date filter, chip filters
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";

import StudentOverviewStory from "./StudentOverviewStory";
import BookingStory from "./BookingStory";
import ProblemStory from "./ProblemStory";
import RiskStory from "./RiskStory";
import RecommendationCard from "./RecommendationCard";

export default function HeadDepartmentDashboard() {
    const [dept, setDept] = useState<{ nameTh: string; facultyNameTh: string; universityNameTh: string } | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/v2/dashboards/head-department?story=students&all_time=true", {
                    credentials: "include",
                });
                const json = await res.json();
                if (json.data?.department) setDept(json.data.department);
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
                        <div className="w-2 h-9 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                        <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            แผงควบคุมหัวหน้าภาควิชา
                        </h1>
                    </div>
                    {dept && (
                        <p className="text-sm text-slate-400 ml-4">
                            <span className="font-semibold text-indigo-500">{dept.nameTh}</span>
                            {" — "}{dept.facultyNameTh}{" — "}{dept.universityNameTh}
                        </p>
                    )}
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

                {/* Row 4: Recommendations */}
                <RecommendationCard delay={4} />

                {/* Footer */}
                <div className="text-center text-xs text-slate-300 py-3 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "400ms" }}>
                    อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                </div>
            </div>
        </div>
    );
}
