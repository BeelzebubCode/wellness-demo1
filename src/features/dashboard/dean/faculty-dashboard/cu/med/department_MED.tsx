"use client";

import React, { useState } from "react";
import { MOCK_DEPARTMENTS, DepartmentStat } from "./listing/DepartmentList_MED";
import { DepartmentDashboard_MED } from "./detail/DepartmentDashboard_MED";
import { HeaderBadgeItem } from "../../shared/components/FacultyHeaderBanner";
import {
  SummaryStat,
  SessionTrendItem,
  RiskItem,
  ProblemItem,
} from "../../shared/components/FacultyOverview";
import { FacultyInformation } from "../../shared/components/FacultyInformation";
import {
  Building2,
  GraduationCap,
  Heart,
  Activity,
  Users,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

const OVERVIEW_SUMMARY_STATS: SummaryStat[] = [
  {
    icon: <Users />,
    title: "นิสิตในสังกัด",
    value: "3,145",
    borderClass: "border-l-primary",
    footer: <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">ข้อมูลจากทะเบียน</span>,
  },
  {
    icon: <AlertTriangle />,
    title: "กลุ่มเสี่ยงสูง",
    value: "0.0%",
    valueColor: "text-red-600",
    borderClass: "border-l-primary",
    footer: <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">0 จาก 226 คน</span>,
  },
  {
    icon: <Activity />,
    title: "อัตราการเข้าถึง",
    value: "8.6%",
    borderClass: "border-l-primary",
    footer: (
      <div className="flex items-center gap-2">
        <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded text-[11px] font-black flex items-center">
          ↘ -74.3%
        </span>
        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">จากเดือนก่อน</span>
      </div>
    ),
  },
  {
    icon: <Building2 />,
    title: "เคสที่กำลังดูแล",
    value: "9",
    borderClass: "border-l-primary",
    footer: (
      <div className="flex items-center gap-2">
        <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-black">
          ติดตามอยู่
        </span>
        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">กลับมาซ้ำ 100.0%</span>
      </div>
    ),
  },
];

const SESSION_TREND: SessionTrendItem[] = [
  { name: "13/01", sessions: 180 },
  { name: "20/01", sessions: 165 },
  { name: "27/01", sessions: 195 },
  { name: "03/02", sessions: 155 },
  { name: "10/02", sessions: 120 },
  { name: "12/02", sessions: 85 },
];

const PROBLEM_DISTRIBUTION: RiskItem[] = [
  { name: "สุขภาพจิต/อารมณ์", value: 86, color: "rgb(var(--primary))" },
  { name: "ความเครียด", value: 80, color: "#8b5cf6" },
  { name: "ความสัมพันธ์", value: 14, color: "#ec4899" },
  { name: "กฎหมาย/วินัย", value: 12, color: "#f59e0b" },
  { name: "สารเสพติด/การเสพติด", value: 11, color: "#10b981" },
];

const TOP_PROBLEMS: ProblemItem[] = [
  { name: "สุขภาพจิต/อารมณ์", male: 42, female: 55, other: 15, total: 112 },
  { name: "ความเครียด", male: 32, female: 28, other: 12, total: 72 },
  { name: "ความสัมพันธ์", male: 5, female: 8, other: 4, total: 17 },
  { name: "กฎหมาย/วินัย", male: 4, female: 6, other: 2, total: 12 },
  { name: "สารเสพติด/การเสพติด", male: 6, female: 2, other: 3, total: 11 },
  { name: "การปรับตัว", male: 3, female: 5, other: 2, total: 10 },
  { name: "ครอบครัว", male: 4, female: 3, other: 2, total: 9 },
  { name: "ถูกรังแก/ความรุนแรง", male: 2, female: 4, other: 1, total: 7 },
];

const HEADER_BADGES: HeaderBadgeItem[] = [
  { icon: <Building2 className="w-3.5 h-3.5" />, label: "8 ภาควิชา" },
  { icon: <GraduationCap className="w-3.5 h-3.5" />, label: "MED_CU" },
];

export function Department_MED() {
  const [selectedDept, setSelectedDept] = useState<DepartmentStat | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "departments" | "filters">(
    "overview",
  );

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
    problemDistribution: PROBLEM_DISTRIBUTION,
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

