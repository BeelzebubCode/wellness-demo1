// features/dashboard/head-consultant/components/HeadConsultantDashboard.tsx
"use client";

import { useHeadConsultantDashboard } from "../hooks/useHeadConsultantDashboard";
import { HeadConsultantStats } from "./HeadConsultantStats";
import { TeamStatusCard } from "./TeamStatusCard";
import { LoadingSpinner, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

export function HeadConsultantDashboard() {
  const { stats, team, isLoading } = useHeadConsultantDashboard();

  if (isLoading || !stats) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">แผงควบคุมหัวหน้าผู้ให้คำปรึกษา</h1>
        <p className="text-gray-500">ภาพรวมการทำงานของทีมผู้ให้คำปรึกษาและสถิติเคส</p>
      </div>

      <HeadConsultantStats stats={stats} />

      <div className="grid gap-6 md:grid-cols-2">
        <TeamStatusCard team={team} />

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>งานที่มอบหมายล่าสุด</CardTitle>
            <CardDescription>การกระจายงานให้กับทีม</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 text-center py-8">
              ยังไม่มีการมอบหมายงานล่าสุด
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
