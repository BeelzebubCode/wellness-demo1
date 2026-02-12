"use client";

import React, { useState } from "react";
import { MOCK_DEPARTMENTS_ABAC_BUS, DepartmentStat } from "./listing/DepartmentList_BUS";
import { DepartmentDashboard_BUS } from "./detail/DepartmentDashboard_BUS";
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
  Briefcase,
} from "lucide-react";
import { useDeanFacultyData } from "../../shared/hooks/useDeanFacultyData";


export function Department_BUS() {
  const { data, loading, error } = useDeanFacultyData();
  const [activeDepartment, setActiveDepartment] = useState<DepartmentStat | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "departments" | "filters">(
    "overview",
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>เกิดข้อผิดพลาดในการโหลดข้อมูล: {error || "ไม่พบข้อมูล"}</p>
      </div>
    );
  }

  if (activeDepartment) {
    return (
      <DepartmentDashboard_BUS 
        department={activeDepartment} 
        facultyName={data.facultyName}
        universityName={data.universityName}
        onBack={() => {
          setActiveDepartment(null);
          setActiveTab("overview");
        }}
        onBackToList={() => {
          setActiveDepartment(null);
          setActiveTab("departments");
        }}
      />
    );
  }

  // Map Summary Stats
  const summaryStats: SummaryStat[] = [
    {
      icon: <Users />,
      title: "Total Students",
      value: data.totalStudents.toLocaleString(),
      borderClass: "border-l-red-600",
      footer: <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Registrar Data</span>,
    },
    {
      icon: <AlertTriangle />,
      title: "High Risk Group",
      value: data.riskDistribution.HIGH.toLocaleString(),
      valueColor: "text-red-500",
      borderClass: "border-l-red-600",
      footer: <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{data.riskDistribution.HIGH} of {data.totalStudents} Std.</span>,
    },
    {
      icon: <Activity />,
      title: "Engagement Rate",
      value: `${((data.totalBookings / (data.totalStudents || 1)) * 100).toFixed(1)}%`,
      borderClass: "border-l-red-600",
      footer: (
        <div className="flex items-center gap-2">
          <span className={`${parseFloat(data.visitTrend) >= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'} px-1.5 py-0.5 rounded text-[11px] font-black flex items-center`}>
            {parseFloat(data.visitTrend) >= 0 ? "↗" : "↘"} {data.visitTrend}%
          </span>
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">vs Last Month</span>
        </div>
      ),
    },
    {
      icon: <Briefcase />,
      title: "Active Cases",
      value: data.activeCases.toLocaleString(),
      borderClass: "border-l-red-600",
      footer: (
        <div className="flex items-center gap-2">
          <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[11px] font-black">
            Ongoing
          </span>
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Active Cases</span>
        </div>
      ),
    },
  ];

  // Map Session Trend
  const sessionTrend: SessionTrendItem[] = Object.entries(data.visitsByMonth).map(([month, count]) => ({
    name: month.split("-")[1] + "/" + month.split("-")[0].slice(2),
    sessions: count as number,
  }));

  // Map Problem Distribution (Top 5 categories)
  const problemDistribution: RiskItem[] = Object.entries(data.problemStats)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([name, value], index) => ({
      name,
      value: value as number,
      color: ["#ef4444", "#f87171", "#fca5a5", "#fcd34d", "#cbd5e1"][index] || "#cbd5e1",
    }));

  // Map Top Problems
  const topProblems: ProblemItem[] = Object.entries(data.genderProblemStats).reduce((acc: ProblemItem[], [gender, categories]) => {
    Object.entries(categories).forEach(([name, count]) => {
      const existing = acc.find(p => p.name === name);
      const c = count as number;
      if (existing) {
        if (gender === "Male") existing.male = c;
        else if (gender === "Female") existing.female = c;
        else existing.other = c;
        existing.total = existing.male + existing.female + existing.other;
      } else {
        acc.push({
          name,
          male: gender === "Male" ? c : 0,
          female: gender === "Female" ? c : 0,
          other: gender === "Other" ? c : 0,
          total: c
        });
      }
    });
    return acc;
  }, []).sort((a, b) => b.total - a.total).slice(0, 8);

  // Map Departments
  const departments: DepartmentStat[] = data.departmentStats.map((d) => ({
    id: d.departmentId.toString(),
    code: `${data.facultyCode}-${d.departmentCode}`,
    name: d.departmentName,
    students: d.studentCount,
    sessions: d.bookingCount,
    perStudent: d.bookingCount / (d.studentCount || 1),
    riskData: [
      { name: "สูง (High Risk)", value: d.riskDistribution.HIGH, color: "#ef4444" },
      { name: "ปกติ (Normal)", value: d.studentCount - d.riskDistribution.HIGH, color: "#10b981" },
    ],
    trendData: Object.entries(d.visitsByMonth || {}).map(([month, count]) => ({
      month: month.split("-")[1] + "/" + month.split("-")[0].slice(2),
      sessions: count as number,
    })),
    topProblems: Object.entries(d.genderProblemStats || {}).reduce((acc: any[], [gender, categories]) => {
      Object.entries(categories as Record<string, number>).forEach(([name, count]) => {
        const existing = acc.find(p => p.name === name);
        const c = count as number;
        if (existing) {
          if (gender === "Male") existing.male = c;
          else if (gender === "Female") existing.female = c;
          else existing.other = c;
          existing.total = existing.male + existing.female + existing.other;
        } else {
          acc.push({
            name,
            male: gender === "Male" ? c : 0,
            female: gender === "Female" ? c : 0,
            other: gender === "Other" ? c : 0,
            total: c
          });
        }
      });
      return acc;
    }, []).sort((a, b) => b.total - a.total).slice(0, 8)
  }));

  const headerBadges: HeaderBadgeItem[] = [
    { icon: <Building2 className="w-3.5 h-3.5" />, label: `${data.totalDepartments} Depts` },
    { icon: <GraduationCap className="w-3.5 h-3.5" />, label: data.facultyCode },
  ];

  return (
    <FacultyInformation
      facultyName={data.facultyName}
      universityName={data.universityName}
      logoUrl={data.universityLogoUrl}
      badges={headerBadges}
      departments={departments}
      onSelectDepartment={setActiveDepartment}
      activeTab={activeTab}
      onTabChange={(t) => setActiveTab(t)}
      recentCases={data.recentCases}
      strategicAnalysis={data.strategicAnalysis}
      overviewStats={{
        summaryStats,
        sessionTrend,
        problemDistribution,
        topProblems,
      }}
    />
  );
}
