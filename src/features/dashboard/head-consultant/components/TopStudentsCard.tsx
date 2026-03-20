// features/dashboard/head-consultant/components/TopStudentsCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ⭐ Data Story: นิสิตคะแนนสูงสุด — Leaderboard + narration
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Crown, Medal } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { getTopStudents } from "../actions";
import type { TopStudent } from "../hooks/useHeadConsultantDashboard";
import { cn } from "@/lib/cn";

export function TopStudentsCard({ delay = 0, students: initialStudents }: { delay?: number; students?: TopStudent[] }) {
  const [data, setData] = useState<TopStudent[]>(initialStudents ?? []);
  const [loading, setLoading] = useState(!initialStudents?.length);

  useEffect(() => {
    if (initialStudents && initialStudents.length > 0 && loading === false) return;

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getTopStudents(); // Top students is global points, no date filtering needed.
        if (!cancelled) setData(result);
      } catch { /* silent */ } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []); // Run once

  const topThree = data.slice(0, 3);
  const others = data.slice(3, 10);

  const getRankStyles = (index: number) => {
    switch (index) {
      case 0: return { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-500", border: "border-amber-200" };
      case 1: return { bg: "bg-slate-100", text: "text-slate-700", icon: "text-slate-400", border: "border-slate-200" };
      case 2: return { bg: "bg-orange-50", text: "text-orange-700", icon: "text-orange-400", border: "border-orange-200" };
      default: return null;
    }
  };

  const narration = loading
    ? "กำลังโหลด..."
    : data.length === 0
      ? "ยังไม่มีข้อมูลคะแนน"
      : `Top 10 สะสมคะแนนสะสม — อันดับ 1 ${topThree[0]?.firstName} (${topThree[0]?.points.toLocaleString()} คะแนน) 🏆`;

  return (
    <DataStoryCard
      icon={<Trophy className="w-5 h-5" />}
      iconGradient="bg-gradient-to-br from-yellow-400 to-amber-600"
      title="Leaderboard คะแนนสูงสุด"
      description="ติดตามอันดับนิสิตที่สะสมคะแนนจากกิจกรรม (เช่น เข้าพบตามนัด หรือทำภารกิจสำเร็จ) เพื่อสร้างสีสันและใช้พิจารณาให้รางวัล"
      narration={narration}
      datePreset="all"
      kpis={!loading && topThree[0] ? [
        { label: "อันดับ 1", value: topThree[0].firstName, color: "#f59e0b" },
        { label: "คะแนนสูงสุด", value: topThree[0].points, color: "#d97706" },
      ] : undefined}
      delay={delay}
      loading={loading}
    >
      {data.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top 3 Players</p>
          <div className="grid gap-2">
            {topThree.map((student, idx) => {
              const style = getRankStyles(idx);
              if (!style) return null;
              return (
                <div key={student.studentId} className={cn("flex items-center justify-between p-2.5 rounded-xl border transition-all", style.bg, style.border)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("flex items-center justify-center shrink-0", style.icon)}>
                      {idx === 0 ? <Crown className="w-6 h-6" /> : <Medal className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{student.firstName} {student.lastName}</p>
                      <p className="text-[10px] font-medium text-slate-500 truncate">{student.studentCode || student.username}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className={cn("text-base font-black tabular-nums leading-none", style.text)}>
                      {student.points.toLocaleString()}
                    </div>
                    <div className="text-[9px] font-bold uppercase text-slate-400">Pts</div>
                  </div>
                </div>
              );
            })}
          </div>

          {others.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">อันดับที่ 4 - 10</p>
              <div className="overflow-y-auto max-h-[160px] custom-scrollbar pr-2 space-y-1">
                {others.map((student, idx) => (
                  <div key={student.studentId} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-5 text-center text-[10px] font-bold text-slate-400 shrink-0">#{idx + 4}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-700 truncate">{student.firstName} {student.lastName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-[11px] font-bold text-slate-600tabular-nums">{student.points.toLocaleString()} Pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DataStoryCard>
  );
}
