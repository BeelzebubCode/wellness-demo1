"use client";

import React, { useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { FacultyHeaderBanner, HeaderBadgeItem } from "./FacultyHeaderBanner";
import { FacultyOverview, SummaryStat, SessionTrendItem, RiskItem, ProblemItem } from "./FacultyOverview";

import { DepartmentStat } from "./DepartmentListing";



interface Props {
  facultyName: string;
  universityName: string;
  logoUrl?: string; // Optional now
  badges: HeaderBadgeItem[];
  overviewStats: {
    summaryStats: SummaryStat[];
    sessionTrend: SessionTrendItem[];
    problemDistribution: RiskItem[];
    topProblems: ProblemItem[];
  };
  recentCases: any[];
  strategicAnalysis?: {
    riskGroup: { name: string; count: number; sub: string };
    topProblem: { name: string; count: number; sub: string };
  };
  departments: DepartmentStat[];


  startDate?: Date;
  endDate?: Date;
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
}

export function FacultyInformation({
  facultyName,
  universityName,
  logoUrl,
  badges,
  overviewStats,
  recentCases,
  strategicAnalysis,
  departments,


  startDate: controlledStartDate,
  endDate: controlledEndDate,
  onDateRangeChange
}: Props) {
  const [internalStartDate, setInternalStartDate] = useState<Date | undefined>(undefined);
  const [internalEndDate, setInternalEndDate] = useState<Date | undefined>(undefined);

  const startDate = controlledStartDate ?? internalStartDate;
  const endDate = controlledEndDate ?? internalEndDate;

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (onDateRangeChange) {
      onDateRangeChange(range);
    } 
    
    // Always update internal state to keep UI in sync
    setInternalStartDate(range.from);
    setInternalEndDate(range.to);
  };


  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <FacultyHeaderBanner
        facultyName={facultyName}
        universityName={universityName}
        logoUrl={logoUrl}
        badges={badges}
      />





      {/* Content Area */}
      <main className="max-w-7xl mx-auto p-6 md:p-12 pb-32">
        <FacultyOverview 
             facultyName={facultyName}
             universityName={universityName}
             summaryStats={overviewStats.summaryStats}
             sessionTrend={overviewStats.sessionTrend}
             problemDistribution={overviewStats.problemDistribution}
             topProblems={overviewStats.topProblems}
             strategicAnalysis={strategicAnalysis}
             departmentComparison={departments.map(d => ({
               name: d.name,
               code: d.code,
               students: d.students,
               sessions: d.sessions,
               accessRate: d.students > 0 ? (d.sessions / d.students) * 100 : 0
             }))}
             startDate={startDate}
             endDate={endDate}
             onDateRangeChange={handleDateRangeChange}
          />
      </main>
    </div>
  );
}


