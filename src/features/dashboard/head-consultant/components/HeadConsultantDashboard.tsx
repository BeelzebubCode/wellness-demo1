// features/dashboard/head-consultant/components/HeadConsultantDashboard.tsx
"use client";

import { useState } from "react";
import { useHeadConsultantDashboard } from "../hooks/useHeadConsultantDashboard";
import { HeadConsultantStats } from "./HeadConsultantStats";
import { ProblemCategoryChart } from "./ProblemCategoryChart";
import { ConsultantRatingTable } from "./ConsultantRatingTable";
import { TopStudentsCard } from "./TopStudentsCard";
import { TeamStatusCard } from "./TeamStatusCard";
import { TeamMembersView } from "./TeamMembersView";
import { ConsultantHistoryView } from "./ConsultantHistoryView";
import { LoadingSpinner } from "@/components/ui";
import { LayoutDashboard, Users, Grid, List, Building2, Calendar, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

type DashboardTab = "overview" | "team";

export function HeadConsultantDashboard() {
  const { stats, categories, topStudents, ratings, team, isLoading } =
    useHeadConsultantDashboard();

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  if (isLoading) {
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* ── Faculty/University Banner ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-white shadow-2xl">
        {/* Decorative background elements */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                <Building2 className="h-10 w-10 text-primary-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-black tracking-tight">ศูนย์สุขภาวะทางจิต</h2>
              <p className="mt-1 text-lg font-medium text-slate-400 flex items-center gap-2">
                จุฬาลงกรณ์มหาวิทยาลัย
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span className="text-primary-400">Head Consultant Portal</span>
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                  <Users className="h-3.5 w-3.5" />
                  {team.length} สมาชิกในทีม
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  เปิดการใช้งานปกติ
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block text-right">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">สถานะปัจจุบัน</p>
            <p className="text-xs text-slate-500">
              อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ─────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-8">
          <button
            onClick={() => { setActiveTab("overview"); setSelectedMemberId(null); }}
            className={cn(
              "relative pb-4 text-sm font-black transition-all",
              activeTab === "overview" && !selectedMemberId ? "text-primary-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              ภาพรวมทั้งหมด (Overview)
            </div>
            {activeTab === "overview" && !selectedMemberId && (
              <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-primary-600" />
            )}
          </button>
          <button
            onClick={() => { setActiveTab("team"); setSelectedMemberId(null); }}
            className={cn(
              "relative pb-4 text-sm font-black transition-all",
              (activeTab === "team" || selectedMemberId) ? "text-primary-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              สมาชิกทีม (Team Members)
            </div>
            {(activeTab === "team" || selectedMemberId) && (
              <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-primary-600" />
            )}
          </button>
        </div>
      </div>

      {/* ── Content View ─────────────────────────── */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {selectedMemberId && selectedMember ? (
          <ConsultantHistoryView
            member={selectedMember}
            onBack={() => setSelectedMemberId(null)}
          />
        ) : activeTab === "overview" ? (
          <div className="space-y-8">
            <section>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <LayoutDashboard className="h-6 w-6 text-primary-500" />
                  สถิติสำคัญ
                </h3>
              </div>
              {stats && <HeadConsultantStats stats={stats} />}
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <ProblemCategoryChart categories={categories} />
              <ConsultantRatingTable ratings={ratings} />
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <TopStudentsCard students={topStudents} />
              <TeamStatusCard team={team} />
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
