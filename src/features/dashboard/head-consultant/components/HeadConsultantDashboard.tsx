// features/dashboard/head-consultant/components/HeadConsultantDashboard.tsx
"use client";

import { useHeadConsultantDashboard } from "../hooks/useHeadConsultantDashboard";
import { HeadConsultantStats } from "./HeadConsultantStats";
import { ProblemCategoryChart } from "./ProblemCategoryChart";
import { ConsultantRatingTable } from "./ConsultantRatingTable";
import { TopStudentsCard } from "./TopStudentsCard";
import { TeamStatusCard } from "./TeamStatusCard";
import { LoadingSpinner } from "@/components/ui";
import { LayoutDashboard } from "lucide-react";

export function HeadConsultantDashboard() {
  const { stats, categories, topStudents, ratings, team, isLoading } =
    useHeadConsultantDashboard();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ─────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            แผงควบคุมหัวหน้าผู้ให้คำปรึกษา
          </h1>
          <p className="text-sm text-gray-500">
            ภาพรวมเคส ประเภทปัญหา คะแนน Consultant และแต้มสะสมนิสิต
          </p>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────── */}
      {stats && <HeadConsultantStats stats={stats} />}

      {/* ── Middle Row: Category + Rating ──── */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProblemCategoryChart categories={categories} />
        <ConsultantRatingTable ratings={ratings} />
      </div>

      {/* ── Bottom Row: Students + Team ─────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopStudentsCard students={topStudents} />
        <TeamStatusCard team={team} />
      </div>
    </div>
  );
}
