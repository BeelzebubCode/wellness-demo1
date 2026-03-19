"use client";

import React, { useState, useEffect } from "react";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";
import { RectorFilter } from "./sections/RectorFilter";
import RectorStatsCards from "./sections/RectorStatsCards";
import FacultyConsultationChart from "./sections/FacultyConsultationChart";
import StaffUtilizationDonut from "./sections/StaffUtilizationDonut";
import PolicySummaryCard from "./sections/PolicySummaryCard";
import RectorBookingSection from "./sections/RectorBookingSection";
import RectorRiskSection from "./sections/RectorRiskSection";
import RectorProblemSection from "./sections/RectorProblemSection";
import { RectorDashboardFilters } from "../types";

const API = "/api/v2/dashboards/rector/story";

export function RectorDashboard() {
    const [university, setUniversity] = useState<{
        nameTh: string; code: string;
    } | null>(null);

    const [filters, setFilters] = useState<RectorDashboardFilters>({
        // Default to last 30 days if needed, otherwise empty
    });

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
        <div className="min-h-screen pb-10">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="space-y-6">
                {/* Header */}
                <div className="animate-[fadeUp_0.5s_ease-out_both] flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
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
                </div>

                {/* Global Filters */}
                <div className="animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "50ms" }}>
                    <RectorFilter filters={filters} onFilterChange={setFilters} />
                </div>

                {/* KPI Overview */}
                <RectorStatsCards globalFilters={filters} />

                {/* ★ Hero: Faculty-level consultation chart */}
                <FacultyConsultationChart globalFilters={filters} />

                {/* Row 1: Staff Utilization + Policy Summary */}
                <DataStoryGrid cols={2}>
                    <StaffUtilizationDonut globalFilters={filters} />
                    <PolicySummaryCard globalFilters={filters} />
                </DataStoryGrid>

                {/* Row 2: Bookings + Risk */}
                <DataStoryGrid cols={2}>
                    <RectorBookingSection 
                        apiPath={API} 
                        title="การใช้บริการทั้งมหาวิทยาลัย" 
                        delay={2} 
                        globalFilters={filters} 
                    />
                    <RectorRiskSection 
                        apiPath={API} 
                        title="ระดับความเสี่ยงทั้งมหาวิทยาลัย" 
                        delay={3} 
                        globalFilters={filters} 
                    />
                </DataStoryGrid>

                {/* Row 3: Problems + Profile */}
                <RectorProblemSection 
                    apiPath={API} 
                    title="ประเด็นปัญหา + โปรไฟล์นิสิตทั้งมหาวิทยาลัย" 
                    delay={4} 
                    globalFilters={filters} 
                />

                {/* Footer */}
                <div className="text-center text-xs text-slate-300 py-6 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "400ms" }}>
                    อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                </div>
            </div>
        </div>
    );
}
