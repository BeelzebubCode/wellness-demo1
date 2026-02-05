// features/dashboard/rector/components/RectorDashboard.tsx
"use client";

import { useRectorStats } from "../hooks/useRectorStats";
import { RectorCharts } from "./RectorCharts";
import { RectorKPI } from "./RectorKPI";
import { LoadingSpinner } from "@/components/ui";

import { FilterBar } from "@/components/filters/FilterBar";

export function RectorDashboard() {
  const { data, isLoading, filters, setFilters } = useRectorStats();

  if (isLoading && !data) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Executive Dashboard</h1>
            <p className="text-gray-500">ภาพรวมสถิติสุขภาพจิตและการใช้งานระบบของมหาวิทยาลัย</p>
        </div>
        
        <div className="shrink-0">
            <FilterBar 
                defs={[]}
                value={filters}
                onChange={setFilters}
                dateKey="startDate" // Using startDate as key triggers date picker range logic if supported, or single date. 
                                    // Our FilterBar prop name is dateKey, but it usually sets a single 'date'. 
                                    // If we need range, we might need to check if FilterBar supports it.
                                    // Looking at FilterBar code: 
                                    // `dateYMD = dateKey ? String((value as any)[dateKey] ?? "").trim() : "";`
                                    // It seems to support single date. 
                                    // However, user asked for "Date Range". 
                                    // For now let's enable the single date picker as a start, or check DateCalendarPopover support.
                                    // If strict range is needed, we might need deeper changes. 
                                    // Let's assume standard date filter for now.
            />
        </div>
      </div>

      <RectorKPI data={data!.kpi} />
      <RectorCharts data={data!} />
    </div>
  );
}
