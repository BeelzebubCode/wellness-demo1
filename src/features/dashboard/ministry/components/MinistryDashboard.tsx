// features/dashboard/ministry/components/MinistryDashboard.tsx
"use client";

import { useMinistryStats } from "../hooks/useMinistryStats";
import { MinistryStatsCards } from "./MinistryStatsCards";
import { RiskyUniversityTable } from "./RiskyUniversityTable";
import { RiskDistributionChart } from "./RiskDistributionChart";
import { LoadingSpinner } from "@/components/ui";

export function MinistryDashboard() {
  const { stats, riskyUnis, riskDistribution, isLoading } = useMinistryStats();

  if (isLoading || !stats) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">National Wellness Overview</h1>
        <p className="text-gray-500">รายงานภาพรวมสุขภาพจิตนิสิตระดับประเทศ (กระทรวง อว.)</p>
      </div>

      <MinistryStatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <RiskDistributionChart data={riskDistribution} />
         <RiskyUniversityTable universities={riskyUnis} />
      </div>
    </div>
  );
}
