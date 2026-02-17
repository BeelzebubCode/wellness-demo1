"use client";

import React, { useState } from "react";
import { LayoutDashboard, Search, Filter } from "lucide-react";
import { FacultyHeaderBanner, HeaderBadgeItem } from "./FacultyHeaderBanner";
import { FacultyOverview, SummaryStat, SessionTrendItem, RiskItem, ProblemItem } from "./FacultyOverview";
import { FacultyDateRangePicker } from "./FacultyDateRangePicker";
import { DepartmentListing, DepartmentStat } from "./DepartmentListing";
import dynamic from "next/dynamic";

const FacultyFilterView = dynamic(() => import("./FacultyFilterView").then(mod => mod.FacultyFilterView), {
  loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-xl" />,
  ssr: false
});

type TabType = "overview" | "departments" | "filters";

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
  onSelectDepartment: (dept: DepartmentStat) => void;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
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
  onSelectDepartment,
  activeTab: controlledTab,
  onTabChange,
  startDate: controlledStartDate,
  endDate: controlledEndDate,
  onDateRangeChange
}: Props) {
  const [internalTab, setInternalTab] = useState<TabType>("overview");
  const [internalStartDate, setInternalStartDate] = useState<Date | undefined>(undefined);
  const [internalEndDate, setInternalEndDate] = useState<Date | undefined>(undefined);

  const activeTab = controlledTab ?? internalTab;
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
  const handleTabChange = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <FacultyHeaderBanner
        facultyName={facultyName}
        universityName={universityName}
        logoUrl={logoUrl}
        badges={badges}
      />

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between">
            <div className="flex gap-10">
              <TabButton
                active={activeTab === "overview"}
                onClick={() => handleTabChange("overview")}
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Dashboard"
              />
              <TabButton
                active={activeTab === "departments"}
                onClick={() => handleTabChange("departments")}
                icon={<Search className="w-4 h-4" />}
                label="ภาควิชา"
              />
              <TabButton
                active={activeTab === "filters"}
                onClick={() => handleTabChange("filters")}
                icon={<Filter className="w-4 h-4" />}
                label="ตัวกรอง"
              />
            </div>
            
            {/* Date Range Picker */}
            <FacultyDateRangePicker 
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto p-6 md:p-12 pb-32">
        {activeTab === "overview" ? (
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
        ) : activeTab === "departments" ? (
          <DepartmentListing
            departments={departments}
            onSelect={onSelectDepartment}
          />
        ) : (
          <FacultyFilterView cases={recentCases} />
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 py-5 px-1 border-b-4 transition-all relative group
        ${active
          ? "border-[rgb(var(--primary))] text-[rgb(var(--primary))] font-bold"
          : "border-transparent text-slate-400 hover:text-slate-600 font-medium"
        }`}
    >
      <span className={`${active ? "text-[rgb(var(--primary))]" : "text-slate-300 group-hover:text-slate-400"} transition-colors`}>
        {icon}
      </span>
      <span className="text-sm tracking-wide">{label}</span>
      {active && (
        <div className="absolute inset-x-0 -bottom-1 h-1 bg-[rgb(var(--primary))] rounded-t-full blur-[2px] opacity-30" />
      )}
    </button>
  );
}
