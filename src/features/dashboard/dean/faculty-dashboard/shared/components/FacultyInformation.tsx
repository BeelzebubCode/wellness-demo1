"use client";

import React, { useState } from "react";
import { LayoutDashboard, Search, Filter } from "lucide-react";
import { FacultyHeaderBanner, HeaderBadgeItem } from "./FacultyHeaderBanner";
import { FacultyOverview, SummaryStat, SessionTrendItem, RiskItem, ProblemItem } from "./FacultyOverview";
import { DepartmentListing, DepartmentStat } from "./DepartmentListing";
import { FacultyFilterView } from "./FacultyFilterView";

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
  departments,
  onSelectDepartment,
  activeTab: controlledTab,
  onTabChange,
  startDate: controlledStartDate,
  endDate: controlledEndDate,
  onDateRangeChange
}: Props) {
  const [internalTab, setInternalTab] = useState<TabType>("overview");
  const [internalStartDate, setInternalStartDate] = useState<Date | undefined>(new Date(2026, 0, 13)); // 13/01/2569
  const [internalEndDate, setInternalEndDate] = useState<Date | undefined>(new Date(2026, 1, 12));  // 12/02/2569

  const activeTab = controlledTab ?? internalTab;
  const startDate = controlledStartDate ?? internalStartDate;
  const endDate = controlledEndDate ?? internalEndDate;

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (onDateRangeChange) {
      onDateRangeChange(range);
    } else {
      setInternalStartDate(range.from);
      setInternalEndDate(range.to);
    }
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
          <FacultyFilterView />
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
