"use client";

import React, { useState, useCallback } from "react";
import { 
  Building2, GraduationCap, Heart, Activity, Users, 
  AlertTriangle, Sprout, Stethoscope, Beaker, Briefcase, Settings, Calendar
} from "lucide-react";
import { useDeanFacultyData } from "@/features/dashboard/dean/hooks/useDeanFacultyData";
import { FacultyInformation } from "./FacultyInformation";
import { UnifiedDepartmentDashboard } from "./UnifiedDepartmentDashboard";
import { DepartmentStat } from "./DepartmentListing";
import { SummaryStat, SessionTrendItem, RiskItem, ProblemItem } from "./FacultyOverview";
import { HeaderBadgeItem } from "./FacultyHeaderBanner";

interface Props {
  facultyCode?: string;
}

export function UnifiedFacultyDashboard({ facultyCode }: Props) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { data, loading, error, refetch } = useDeanFacultyData(facultyCode, startDate, endDate);
  const [activeDepartment, setActiveDepartment] = useState<DepartmentStat | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "departments" | "filters">("overview");

  const handleDateRangeChange = useCallback((range: { from?: Date; to?: Date }) => {
    setStartDate(range.from);
    setEndDate(range.to);
    refetch(range.from, range.to);
  }, [refetch]);

  // Only show loading on initial load (no data yet)
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(var(--primary))]"></div>
      </div>
    );
  }

  // Show error only if no data available
  if (error && !data) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>เกิดข้อผิดพลาดในการโหลดข้อมูล: {error || "ไม่พบข้อมูล"}</p>
      </div>
    );
  }

  // If still no data after loading, show error
  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>ไม่พบข้อมูล</p>
      </div>
    );
  }

  if (activeDepartment) {
    return (
      <UnifiedDepartmentDashboard 
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

  // Branding Logic
  const getFacultyBranding = (code: string) => {
    const c = code.toLowerCase();
    if (c.includes("med")) return { icon: <Stethoscope />, color: "border-l-green-600", chartColors: ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#cbd5e1"] };
    if (c.includes("eng")) return { icon: <Settings />, color: "border-l-rose-600", chartColors: ["#e11d48", "#f43f5e", "#fb7185", "#fda4af", "#cbd5e1"] };
    if (c.includes("agri")) return { icon: <Sprout />, color: "border-l-orange-500", chartColors: ["#f97316", "#fb923c", "#fdba74", "#fcd34d", "#cbd5e1"] };
    if (c.includes("bus")) return { icon: <Briefcase />, color: "border-l-blue-600", chartColors: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#cbd5e1"] };
    if (c.includes("sci")) return { icon: <Beaker />, color: "border-l-purple-600", chartColors: ["#9333ea", "#a855f7", "#c084fc", "#d8b4fe", "#cbd5e1"] };
    return { icon: <GraduationCap />, color: "border-l-[rgb(var(--primary))]", chartColors: ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#cbd5e1"] };
  };

  const branding = getFacultyBranding(data.facultyCode);

  // Calculate students per day
  const calculateStudentsPerDay = () => {
    if (!startDate || !endDate) return 0;
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const days = Math.max(1, daysDiff); // At least 1 day
    return (data.totalBookings / days).toFixed(1);
  };

  // Map Summary Stats
  const summaryStats: SummaryStat[] = [
    {
      icon: <Users />,
      title: "นิสิตในสังกัด",
      value: data.totalStudents.toLocaleString(),
      borderClass: branding.color,
      footer: <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">ข้อมูลจากทะเบียน</span>,
    },
    {
      icon: <Calendar />,
      title: "นิสิตต่อวัน",
      value: calculateStudentsPerDay(),
      valueColor: "text-primary",
      borderClass: branding.color,
      footer: <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">คนต่อวันที่เข้ารับการปรึกษา</span>,
    },
    {
      icon: <AlertTriangle />,
      title: "กลุ่มเสี่ยงสูง",
      value: data.riskDistribution.HIGH.toLocaleString(),
      valueColor: "text-red-500",
      borderClass: branding.color,
      footer: <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{data.riskDistribution.HIGH} จาก {data.totalStudents} คน</span>,
    },
    {
      icon: <Activity />,
      title: "อัตราการเข้าถึง",
      value: `${((data.totalBookings / (data.totalStudents || 1)) * 100).toFixed(1)}%`,
      borderClass: branding.color,
      footer: (
        <div className="flex items-center gap-2">
          <span className={`${parseFloat(data.visitTrend) >= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'} px-1.5 py-0.5 rounded text-[11px] font-black flex items-center`}>
            {parseFloat(data.visitTrend) >= 0 ? "↗" : "↘"} {data.visitTrend}%
          </span>
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">จากเดือนก่อน</span>
        </div>
      ),
    },
    {
      icon: branding.icon,
      title: "เคสที่กำลังดูแล",
      value: data.activeCases.toLocaleString(),
      borderClass: branding.color,
      footer: (
        <div className="flex items-center gap-2">
          <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[11px] font-black">
            ติดตามอยู่
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

  // Map Problem Distribution
  const problemDistribution: RiskItem[] = Object.entries(data.problemStats)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([name, value], index) => ({
      name,
      value: value as number,
      color: branding.chartColors[index] || "#cbd5e1",
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
      { name: "วิกฤต (Critical)", value: d.riskDistribution.HIGH, color: "#ef4444" },
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
    }, []).sort((a, b) => b.total - a.total).slice(0, 5)
  }));

  const headerBadges: HeaderBadgeItem[] = [
    { icon: <Building2 className="w-3.5 h-3.5" />, label: `${data.totalDepartments} ภาควิชา` },
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
      onTabChange={setActiveTab}
      recentCases={data.recentCases}
      strategicAnalysis={data.strategicAnalysis}
      overviewStats={{
        summaryStats,
        sessionTrend,
        problemDistribution,
        topProblems,
      }}
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={handleDateRangeChange}
    />
  );
}
