"use client";

import React, { useState } from "react";
import { MOCK_DEPARTMENTS, DepartmentStat } from "./listing/DepartmentList_MED";
import { DepartmentDashboard_MED } from "./detail/DepartmentDashboard_MED";
import { HeaderBadgeItem } from "../../shared/components/FacultyHeaderBanner";
import { SummaryStat, SessionTrendItem, RiskItem, ProblemItem } from "../../shared/components/FacultyOverview";
import { FacultyInformation } from "../../shared/components/FacultyInformation";
import { Building2, GraduationCap, Heart, Activity, Users, BarChart3 } from "lucide-react";

const OVERVIEW_SUMMARY_STATS: SummaryStat[] = [
  { icon: <Heart className="w-5 h-5 text-pink-500" />, title: "คะแนนสุขภาพ (Wellbeing)", value: "87%", trend: "+12%", bgColor: "bg-pink-50" },
  { icon: <Activity className="w-5 h-5 text-amber-500" />, title: "นักศึกษาเสี่ยงสูง (High Risk)", value: "23", bgColor: "bg-amber-50" },
  { icon: <Users className="w-5 h-5 text-indigo-500" />, title: "การให้คำปรึกษา (Sessions)", value: "142", bgColor: "bg-indigo-50" },
  { icon: <BarChart3 className="w-5 h-5 text-cyan-500" />, title: "คะแนนความพึงพอใจ (Rating)", value: "4.8", bgColor: "bg-cyan-50" },
];

const SESSION_TREND: SessionTrendItem[] = [
  { name: "ม.ค.", sessions: 45 },
  { name: "ก.พ.", sessions: 52 },
  { name: "มี.ค.", sessions: 85 },
  { name: "เม.ย.", sessions: 64 },
  { name: "พ.ค.", sessions: 98 },
  { name: "มิ.ย.", sessions: 142 },
];

const RISK_DATA: RiskItem[] = [
  { name: "วิกฤต (Critical)", value: 5, color: "#ef4444" },
  { name: "สูง (High)", value: 18, color: "#f97316" },
  { name: "ปานกลาง (Moderate)", value: 35, color: "#f59e0b" },
  { name: "ปกติ (Normal)", value: 120, color: "#10b981" },
];

const TOP_PROBLEMS: ProblemItem[] = [
  { name: "สุขภาพจิต/อารมณ์", male: 31, female: 21, other: 34, total: 86 },
  { name: "ความเครียด", male: 20, female: 31, other: 29, total: 80 },
  { name: "ความสัมพันธ์", male: 3, female: 4, other: 7, total: 14 },
  { name: "กฎหมาย/วินัย", male: 3, female: 7, other: 2, total: 12 },
  { name: "สารเสพติด/การเสพติด", male: 6, female: 1, other: 4, total: 11 },
  { name: "การปรับตัว", male: 2, female: 5, other: 3, total: 10 },
  { name: "ครอบครัว", male: 5, female: 1, other: 4, total: 10 },
  { name: "ถูกรังแก/ความรุนแรง", male: 1, female: 3, other: 6, total: 10 },
];

const HEADER_BADGES: HeaderBadgeItem[] = [
  { icon: <Building2 className="w-3.5 h-3.5" />, label: "8 ภาควิชา" },
  { icon: <GraduationCap className="w-3.5 h-3.5" />, label: "MED_CU" },
];

export function Department_MED() {
  const [selectedDept, setSelectedDept] = useState<DepartmentStat | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "departments">("overview");

  if (selectedDept) {
    return (
      <DepartmentDashboard_MED 
        department={selectedDept} 
        onBack={() => {
          setSelectedDept(null);
          setActiveTab("overview");
        }}
        onBackToList={() => {
          setSelectedDept(null);
          setActiveTab("departments");
        }}
      />
    );
  }

  const overviewStats = {
    summaryStats: OVERVIEW_SUMMARY_STATS,
    sessionTrend: SESSION_TREND,
    riskData: RISK_DATA,
    topProblems: TOP_PROBLEMS,
  };

  return (
    <FacultyInformation
      facultyName="คณะแพทยศาสตร์"
      universityName="จุฬาลงกรณ์มหาวิทยาลัย"
      badges={HEADER_BADGES}
      overviewStats={overviewStats}
      departments={MOCK_DEPARTMENTS}
      onSelectDepartment={setSelectedDept}
      activeTab={activeTab}
      onTabChange={(t) => setActiveTab(t)}
    />
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
