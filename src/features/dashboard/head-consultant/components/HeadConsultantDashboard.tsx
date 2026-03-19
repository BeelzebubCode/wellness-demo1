// features/dashboard/head-consultant/components/HeadConsultantDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useHeadConsultantDashboard } from "../hooks/useHeadConsultantDashboard";
import { HeadConsultantStats } from "./HeadConsultantStats";
import { TopStudentsCard } from "./TopStudentsCard";

import { TeamMembersView } from "./TeamMembersView";
import { ConsultantHistoryView } from "./ConsultantHistoryView";
import { LoadingSpinner, DateRangePicker } from "@/components/ui";
import {
  LayoutDashboard,
  Users,
  Building2,
  Filter,
  AlertTriangle,
  Clock,
  ShieldAlert,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ✅ Dynamic imports — each story card is self-contained and heavy (Recharts)
const ProblemCategoryChart = dynamic(
  () => import("./ProblemCategoryChart").then(mod => ({ default: mod.ProblemCategoryChart })),
  {
    loading: () => (
      <div className="h-64 bg-slate-50 animate-pulse rounded-xl flex items-center justify-center">
        <p className="text-slate-400 text-sm">กำลังโหลดกราฟ...</p>
      </div>
    ),
    ssr: false
  }
);

const ConsultantRatingTable = dynamic(
  () => import("./ConsultantRatingTable").then(mod => ({ default: mod.ConsultantRatingTable })),
  {
    loading: () => (
      <div className="h-96 bg-slate-50 animate-pulse rounded-xl flex items-center justify-center">
        <p className="text-slate-400 text-sm">กำลังโหลดตาราง...</p>
      </div>
    ),
    ssr: false
  }
);

const RiskDistributionCard = dynamic(
  () => import("./RiskDistributionCard").then(mod => ({ default: mod.RiskDistributionCard })),
  {
    loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />,
    ssr: false
  }
);

const BookingTrendChart = dynamic(
  () => import("./BookingTrendChart").then(mod => ({ default: mod.BookingTrendChart })),
  {
    loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />,
    ssr: false
  }
);

const WorkloadBalanceChart = dynamic(
  () => import("./WorkloadBalanceChart").then(mod => ({ default: mod.WorkloadBalanceChart })),
  {
    loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />,
    ssr: false
  }
);

const PeakHoursCard = dynamic(
  () => import("./PeakHoursCard").then(mod => ({ default: mod.PeakHoursCard })),
  {
    loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-xl" />,
    ssr: false
  }
);

const AttendanceInsightsCard = dynamic(
  () => import("./AttendanceInsightsCard").then(mod => ({ default: mod.AttendanceInsightsCard })),
  {
    loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />,
    ssr: false
  }
);

type DashboardTab = "overview" | "team";

export function HeadConsultantDashboard({
  universityName = "มหาวิทยาลัยขอนแก่น",
}: {
  universityName?: string;
}) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d;
    })(),
    to: new Date()
  });

  // Central hook — still used for stats, categories, top students, ratings, team, alerts
  const {
    stats, categories, topStudents, ratings, team,
    riskDist, responseTime, attendance,
    isLoading,
  } = useHeadConsultantDashboard(dateRange);

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  if (isLoading && !stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50/50 rounded-2xl">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 text-sm animate-pulse">กำลังเตรียมข้อมูลแดชบอร์ด...</p>
        </div>
      </div>
    );
  }

  const selectedMember = team.find(m => m.consultantId === selectedMemberId);

  // Alert counts from centralized data
  const alertHighRisk = riskDist.highRiskCount;
  const alertOverdue = responseTime.overdueCount;
  const alertExceptions = attendance.pendingExceptions;
  const hasAlerts = alertHighRisk > 0 || alertOverdue > 0 || alertExceptions > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* ── Banner ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-[#0f172a] p-8 text-white shadow-2xl mb-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary-600/5 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-white/20">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">
                ศูนย์สุขภาวะทางจิต
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-white/60 text-sm font-bold uppercase tracking-widest">
                <span>{universityName}</span>
                <span className="h-1 w-1 rounded-full bg-primary/40" />
                <span className="text-primary">Head Consultant Portal</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-4 self-stretch md:self-auto">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 opacity-70">สถานะปัจจุบัน</p>
              <div className="text-sm font-bold flex items-center gap-2 justify-end">
                อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })} เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-black">{team.length} สมาชิกในทีม</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md rounded-full px-4 py-2 border border-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-400">เปิดการใช้งานปกติ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────── */}
      <div className="mb-8 border-b border-slate-200">
        <div className="flex gap-10">
          <button
            onClick={() => { setActiveTab("overview"); setSelectedMemberId(null); }}
            className={cn(
              "relative pb-4 text-sm font-black transition-all",
              (activeTab === "overview" && !selectedMemberId) ? "text-primary" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              ภาพรวม (Overview)
            </div>
            {(activeTab === "overview" && !selectedMemberId) && (
              <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-primary" />
            )}
          </button>

          <button
            onClick={() => { setActiveTab("team"); setSelectedMemberId(null); }}
            className={cn(
              "relative pb-4 text-sm font-black transition-all",
              (activeTab === "team" || selectedMemberId) ? "text-primary" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              สมาชิกทีม (Team Members)
            </div>
            {(activeTab === "team" || selectedMemberId) && (
              <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-primary" />
            )}
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {selectedMemberId && selectedMember ? (
          <ConsultantHistoryView
            member={selectedMember}
            onBack={() => setSelectedMemberId(null)}
          />
        ) : activeTab === "overview" ? (
          <div className="space-y-6">

            {/* ── 🔴 Alert Bar ─────────────────────────── */}
            {hasAlerts && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-400">
                <div className="bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border border-red-200/60 rounded-2xl px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-black text-red-700 uppercase tracking-wider">ต้องดำเนินการ</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {alertHighRisk > 0 && (
                      <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-xl px-4 py-2.5 border border-red-200/50 shadow-sm">
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        <div>
                          <span className="text-lg font-black text-red-600 tabular-nums">{alertHighRisk}</span>
                          <span className="text-[11px] text-red-500 ml-1.5 font-bold">เคสเสี่ยงสูง/สูงมาก</span>
                        </div>
                      </div>
                    )}
                    {alertOverdue > 0 && (
                      <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-xl px-4 py-2.5 border border-amber-200/50 shadow-sm">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-lg font-black text-amber-600 tabular-nums">{alertOverdue}</span>
                          <span className="text-[11px] text-amber-500 ml-1.5 font-bold">เคสรอเกิน 48 ชม.</span>
                        </div>
                      </div>
                    )}
                    {alertExceptions > 0 && (
                      <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-xl px-4 py-2.5 border border-orange-200/50 shadow-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <div>
                          <span className="text-lg font-black text-orange-600 tabular-nums">{alertExceptions}</span>
                          <span className="text-[11px] text-orange-500 ml-1.5 font-bold">exception รอ review</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Stats Cards (Original) ─────────────── */}
            <section>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  สถิติสำคัญ
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mr-2">
                    <Filter className="w-4 h-4" />
                    กรองสถิติ:
                  </div>
                  <DateRangePicker
                    startDate={dateRange.from}
                    endDate={dateRange.to}
                    onChange={setDateRange}
                  />
                </div>
              </div>
              {stats && <HeadConsultantStats stats={stats} />}
            </section>

            {/* ── Data Stories Section Header ─────────── */}
            <div className="pt-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-1">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                Data Stories
              </h3>
              <p className="text-xs text-slate-400 mb-6">แต่ละการ์ดเล่าเรื่องและกรองข้อมูลได้อิสระ — กดปุ่ม &quot;ตัวกรอง&quot; ที่มุมขวาบนของแต่ละการ์ด</p>
            </div>

            {/* ── Grid Row 1: Peak Hours + Risk Distribution ────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2">
              <PeakHoursCard delay={0} />
              <RiskDistributionCard delay={1} />
            </div>

            {/* ── Grid Row 2: Problems + Trend ─────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ProblemCategoryChart delay={2} />
              <BookingTrendChart delay={3} />
            </div>

            {/* ── Grid Row 3: Attendance + Workload ──────────── */}
            <div className="grid gap-6 lg:grid-cols-2">
              <AttendanceInsightsCard delay={4} />
              <WorkloadBalanceChart delay={5} />
            </div>

            {/* ── Grid Row 4: Ratings + Top Students ─────── */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ConsultantRatingTable delay={6} />
              <TopStudentsCard delay={7} />
            </div>
          </div>
        ) : (
          <TeamMembersView
            team={team}
            onSelectMember={(id) => setSelectedMemberId(id)}
          />
        )}
      </div>

      {/* ── Footer ─────────────────────────── */}
      <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-500">จิตวิทยาแนะแนว</span>
          <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full"></span>
          <span>ข้อมูล ณ {new Date().toLocaleDateString('th-TH')}</span>
        </div>
        <span className="px-2 py-1 bg-slate-100 rounded text-slate-500 font-mono text-[10px] uppercase tracking-widest font-bold">Confidential</span>
      </div>
    </div>
  );
}
