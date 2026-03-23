// features/dashboard/super-admin/components/SuperAdminDashboard.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ShieldCheck, MonitorDot, Briefcase, BarChart3, Settings, Scale, Siren, Building2, HeartPulse } from "lucide-react";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";

const API = "/api/v2/dashboards/ministry/story";

// Dynamic imports for shared performance heavy components
const SuperAdminStatsCards = dynamic(
  () => import("./SuperAdminStatsCards").then(m => m.SuperAdminStatsCards),
  { loading: () => <div className="h-32 bg-slate-50 animate-pulse rounded-2xl" />, ssr: false }
);
const SuperAdminBorrowTrendChart = dynamic(
  () => import("./SuperAdminBorrowTrendChart").then(m => m.SuperAdminBorrowTrendChart),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-2xl" />, ssr: false }
);
const SuperAdminTopUniversitiesChart = dynamic(
  () => import("./SuperAdminTopUniversitiesChart").then(m => m.SuperAdminTopUniversitiesChart),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-2xl" />, ssr: false }
);
const SystemOverviewCard = dynamic(
  () => import("./SystemOverviewCard").then(m => m.SystemOverviewCard),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-2xl" />, ssr: false }
);

// Restored old dynamic imports
const GenericStudentStory = dynamic(
  () => import("../../shared/GenericStudentStory"),
  { loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-2xl" />, ssr: false }
);
const GenericBookingStory = dynamic(
  () => import("../../shared/GenericBookingStory"),
  { loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-2xl" />, ssr: false }
);


// New operational widgets
const SuperAdminSupplyDemandChart = dynamic(
  () => import("./SuperAdminSupplyDemandChart").then(m => m.SuperAdminSupplyDemandChart),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-2xl" />, ssr: false }
);
const SuperAdminHighRiskSlaChart = dynamic(
  () => import("./SuperAdminHighRiskSlaChart").then(m => m.SuperAdminHighRiskSlaChart),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-2xl" />, ssr: false }
);
const SuperAdminLowAdoptionTable = dynamic(
  () => import("./SuperAdminLowAdoptionTable").then(m => m.SuperAdminLowAdoptionTable),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-2xl" />, ssr: false }
);
const SuperAdminBorrowHealthCard = dynamic(
  () => import("./SuperAdminBorrowHealthCard").then(m => m.SuperAdminBorrowHealthCard),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-2xl" />, ssr: false }
);
export function SuperAdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-[#020617] p-8 text-white shadow-2xl animate-[fadeUp_0.5s_ease-out_both]">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-600/5 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-xl">
              <ShieldCheck className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Super Admin Operations</h1>
              <div className="flex items-center gap-3 mt-1 text-white/50 text-xs font-bold uppercase tracking-widest">
                <span className="text-indigo-300 normal-case text-sm font-semibold">แผงควบคุมระบบเครือข่ายและระบบส่วนกลาง</span>
                <span className="h-1 w-1 rounded-full bg-indigo-400/40" />
                <span>Central Management Dashboard</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right text-xs text-white/40 font-medium">
              <div>{new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</div>
              <div className="text-[10px] mt-0.5">{new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 rounded-full px-3 py-1.5 border border-emerald-500/20">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 0: KPI Stats ──────────────────────────────── */}
      <section className="animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "60ms" }}>
        <div className="mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4 text-indigo-500" />
          <h3 className="text-base font-black text-slate-700">ภาพรวมสถิติระบบ</h3>
        </div>
        <SuperAdminStatsCards />
      </section>

      {/* ── Section 1: System Infrastructure ───────────────────── */}
      <section className="animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "100ms" }}>
        <div className="mb-3 flex items-center gap-2">
          <MonitorDot className="h-4 w-4 text-slate-500" />
          <h3 className="text-base font-black text-slate-700">ภาพรวมระบบ (System Infrastructure)</h3>
        </div>
        <SystemOverviewCard delay={0} />
      </section>

      {/* ── Section 2: Borrow Request Operations ───────────────── */}
      <div className="pt-2 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "150ms" }}>
        <h3 className="text-base font-black text-slate-700 flex items-center gap-2 mb-0.5">
          <Briefcase className="h-4 w-4 text-indigo-500" />
          Borrow Requests & Consultant Operations
        </h3>
        <p className="text-xs text-slate-400">
          วิเคราะห์ระบบคำขอยืมตัวที่ปรึกษาจาก<strong className="text-slate-500">ทุกมหาวิทยาลัยในเครือข่าย</strong>
        </p>
      </div>

      <DataStoryGrid cols={2}>
        <SuperAdminBorrowTrendChart />
        <SuperAdminTopUniversitiesChart />
      </DataStoryGrid>

      {/* ── Section 2b: Borrow System Health ──────────────────── */}
      <SuperAdminBorrowHealthCard />

      {/* ── Section 3: Operational Insights ────────────────────── */}
      <div className="pt-4 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "200ms" }}>
        <h3 className="text-base font-black text-slate-700 flex items-center gap-2 mb-0.5">
          <Siren className="h-4 w-4 text-rose-500" />
          Operational Insights
        </h3>
        <p className="text-xs text-slate-400">
          วิเคราะห์ปัญหาเชิงโครงสร้างเพื่อ<strong className="text-slate-500">ปรับปรุงประสิทธิภาพเครือข่าย</strong>
        </p>
      </div>

      <DataStoryGrid cols={2}>
        <SuperAdminSupplyDemandChart />
        <SuperAdminHighRiskSlaChart />
      </DataStoryGrid>

      {/* ── Section 3b: Low Adoption ──────────────────────────── */}
      <SuperAdminLowAdoptionTable />
      <div className="pt-8 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "200ms" }}>
        <h3 className="text-base font-black text-slate-700 flex items-center gap-2 mb-0.5">
          <BarChart3 className="h-4 w-4 text-emerald-500" />
          National Student Analytics
        </h3>
        <p className="text-xs text-slate-400">
          วิเคราะห์ข้อมูลจาก<strong className="text-slate-500">ทุกมหาวิทยาลัยในระบบรวมกันทั้งหมด</strong>
        </p>
      </div>

      {/* ── Section 3: Student & Booking Overview ──────────────── */}
      <DataStoryGrid cols={2}>
        <GenericStudentStory apiPath={API} title="ภาพรวมนิสิตระดับชาติ" delay={0.3}
          description="จำนวนนิสิตทั้งหมดในระบบ แยกตามอัตราการเข้าใช้บริการ ใช้ประเมินอัตรา Adoption Rate" />
        <GenericBookingStory apiPath={API} title="การใช้บริการระดับชาติ" delay={0.4}
          description="ภาพรวมการนัดหมายและอัตราความสำเร็จในการรับบริการจากทุกสถาบัน" />
      </DataStoryGrid>


      {/* ── Footer ────────────────────────────────────────────── */}
      <div className="pt-8 border-t border-slate-100 flex justify-between items-center text-xs text-slate-300">
        <span>Wellness System Platform — ข้อมูล ณ {new Date().toLocaleDateString("th-TH")}</span>
        <span className="px-2 py-1 bg-slate-50 rounded text-slate-400 font-mono font-bold uppercase tracking-widest text-[10px]">Super Admin Access</span>
      </div>
    </div>
  );
}


