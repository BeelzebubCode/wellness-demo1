"use client";

import React, { useState } from "react";
import { LayoutDashboard, Search } from "lucide-react";
import { FacultyHeaderBanner, HeaderBadgeItem } from "./FacultyHeaderBanner";
import { FacultyOverview, SummaryStat, SessionTrendItem, RiskItem, ProblemItem } from "./FacultyOverview";
import { DepartmentListing, DepartmentStat } from "./DepartmentListing";

type TabType = "overview" | "departments";

interface Props {
  facultyName: string;
  universityName: string;
  logoUrl?: string; // Optional now
  badges: HeaderBadgeItem[];
  overviewStats: {
    summaryStats: SummaryStat[];
    sessionTrend: SessionTrendItem[];
    riskData: RiskItem[];
    topProblems: ProblemItem[];
  };
  departments: DepartmentStat[];
  onSelectDepartment: (dept: DepartmentStat) => void;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
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
  onTabChange
}: Props) {
  const [internalTab, setInternalTab] = useState<TabType>("overview");
  
  const activeTab = controlledTab ?? internalTab;
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
                label="ภาพรวมทั้งหมด"
              />
              <TabButton 
                active={activeTab === "departments"} 
                onClick={() => handleTabChange("departments")}
                icon={<Search className="w-4 h-4" />}
                label="ภาควิชา"
              />
           </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto p-6 md:p-12 pb-32">
        {activeTab === "overview" ? (
          <FacultyOverview 
             summaryStats={overviewStats.summaryStats}
             sessionTrend={overviewStats.sessionTrend}
             riskData={overviewStats.riskData}
             topProblems={overviewStats.topProblems}
          />
        ) : (
          <DepartmentListing 
            departments={departments} 
            onSelect={onSelectDepartment} 
          />
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
