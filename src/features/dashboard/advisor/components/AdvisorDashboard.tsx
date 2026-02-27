"use client";

import dynamic from "next/dynamic";
import { useAnalytics } from "../../widgets/hooks/useAnalytics";
import { DashboardFilterBar } from "../../widgets/filters/DashboardFilterBar";
import { SummaryKPICards } from "../../widgets/cards/SummaryKPICards";

const ProblemCategoryChart = dynamic(
  () => import("../../widgets/charts/ProblemCategoryChart").then((m) => ({ default: m.ProblemCategoryChart })),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const AttendanceChart = dynamic(
  () => import("../../widgets/charts/AttendanceChart").then((m) => ({ default: m.AttendanceChart })),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const RiskDistributionChart = dynamic(
  () => import("../../widgets/charts/RiskDistributionChart").then((m) => ({ default: m.RiskDistributionChart })),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const TrendChart = dynamic(
  () => import("../../widgets/charts/TrendChart").then((m) => ({ default: m.TrendChart })),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const StudentRankTable = dynamic(
  () => import("../../widgets/charts/StudentRankTable").then((m) => ({ default: m.StudentRankTable })),
  { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);

export function AdvisorDashboard() {
  const { data, loading, params, setParams } = useAnalytics();

  return (
    <div className="space-y-8 bg-slate-50 p-6 rounded-2xl">
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">
          แผงควบคุมอาจารย์ที่ปรึกษา
        </h1>
        <p className="text-slate-500">
          ภาพรวมการดูแลนิสิตในที่ปรึกษาของคุณ
        </p>
      </div>

      {/* ===== Advanced Filter ===== */}
      <section className="relative z-40">
        <DashboardFilterBar role="advisor" params={params} onChange={setParams} />
      </section>

      {/* ===== Stats Cards ===== */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <SummaryKPICards data={data?.summary ?? null} loading={loading} />
      </div>

      {/* ===== Student Risk Rank — featured ===== */}
      <div className="bg-white rounded-2xl shadow-sm">
        <StudentRankTable data={data?.studentRank ?? []} loading={loading} />
      </div>

      {/* ===== Analytics Section ===== */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-indigo-900">
            ภาพรวมเชิงวิเคราะห์
          </h2>
          <p className="text-sm text-indigo-600">
            แนวโน้มและสถิติด้านสุขภาวะของนิสิต
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProblemCategoryChart data={data?.problemCategories ?? []} loading={loading} />
          <RiskDistributionChart data={data?.riskDistribution ?? null} loading={loading} />
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart data={data?.attendanceByGroup ?? []} loading={loading} />
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-rose-900">
              แนวโน้มตามเวลา
            </h2>
            <p className="text-sm text-rose-600">
              การเปลี่ยนแปลงจำนวนการจอง/ยกเลิก
            </p>
          </div>
          <TrendChart data={data?.trend ?? []} loading={loading} />
        </div>
      </div>
    </div>
  );
}
