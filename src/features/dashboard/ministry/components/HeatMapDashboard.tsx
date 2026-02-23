// src/features/dashboard/ministry/components/HeatMapDashboard.tsx
"use client";

import React, { useState } from "react";
import { useRiskMetrics } from "../hooks/useRiskMetrics";
import { RegionalRiskCards } from "./RegionalRiskCards";
import { UniversityRiskTable } from "./UniversityRiskTable";
import { AlertTriangle, TrendingUp, Users, Clock, MapPin, Filter, RotateCcw } from "lucide-react";

const REGION_OPTIONS = [
  { value: "", label: "ทั้งหมด" },
  { value: "NORTH", label: "เหนือ" },
  { value: "NORTHEAST", label: "อีสาน" },
  { value: "CENTRAL", label: "กลาง" },
  { value: "SOUTH", label: "ใต้" },
  { value: "EAST", label: "ตะวันออก" },
  { value: "WEST", label: "ตะวันตก" },
];

const TYPE_OPTIONS = [
  { value: "", label: "ทั้งหมด" },
  { value: "PUBLIC", label: "รัฐบาล" },
  { value: "PRIVATE", label: "เอกชน" },
];

const DAYS_OPTIONS = [
  { value: 7, label: "7 วัน" },
  { value: 30, label: "30 วัน" },
  { value: 90, label: "90 วัน" },
];

export function HeatMapDashboard() {
  const [filters, setFilters] = useState({
    region: "",
    type: "",
    days: 7,
  });

  const { data, isLoading, error } = useRiskMetrics(filters);

  const hasActiveFilters = filters.region !== "" || filters.type !== "";
  const resetFilters = () => setFilters({ region: "", type: "", days: 7 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-medium">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-sm">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <div className="text-red-700 font-semibold">เกิดข้อผิดพลาด</div>
          <div className="text-red-500 text-sm mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Calculate summary metrics
  const totalQueue = data.universities.reduce((sum, u) => sum + u.queueSize, 0);
  const avgRiskScore =
    data.universities.reduce((sum, u) => sum + u.riskScore, 0) / data.universities.length || 0;
  const criticalUniversities = data.universities.filter((u) => u.riskScore >= 70).length;
  const avgWaitTime =
    data.universities.reduce((sum, u) => sum + u.avgWaitTime, 0) / data.universities.length || 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-3xl p-8 lg:p-10 shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-16 -mb-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-4">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Risk Heat Map</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            แผนที่ความเสี่ยง
            <span className="block text-lg md:text-xl mt-1.5 font-medium text-slate-300">วิเคราะห์ระดับความเสี่ยงตามภูมิภาคและมหาวิทยาลัย</span>
          </h1>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-indigo-100 text-indigo-600"
          label="Risk Score เฉลี่ย"
          value={avgRiskScore.toFixed(1)}
          suffix="/100"
        />
        <KPICard
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-red-100 text-red-600"
          label="มหาลัยเสี่ยงสูง"
          value={String(criticalUniversities)}
          suffix=" แห่ง"
          valueColor="text-red-600"
        />
        <KPICard
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-amber-100 text-amber-600"
          label="คิวรวมทั้งหมด"
          value={totalQueue.toLocaleString()}
          suffix=" เคส"
        />
        <KPICard
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-emerald-100 text-emerald-600"
          label="รอเฉลี่ย"
          value={avgWaitTime.toFixed(1)}
          suffix=" วัน"
        />
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter className="w-4 h-4 text-gray-400" />
            ตัวกรอง
          </div>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors px-2.5 py-1 rounded-lg hover:bg-gray-100"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                รีเซ็ต
              </button>
            )}
            <span className="text-xs text-gray-400">
              แสดง <span className="font-bold text-gray-600">{data.metadata.totalUniversities}</span> มหาวิทยาลัย
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Region */}
          <FilterChipRow
            label="ภูมิภาค"
            options={REGION_OPTIONS}
            value={filters.region}
            onChange={(v) => setFilters({ ...filters, region: v })}
          />
          {/* Type */}
          <FilterChipRow
            label="ประเภท"
            options={TYPE_OPTIONS}
            value={filters.type}
            onChange={(v) => setFilters({ ...filters, type: v })}
          />
          {/* Days */}
          <FilterChipRow
            label="ช่วงเวลา"
            options={DAYS_OPTIONS.map(d => ({ value: String(d.value), label: d.label }))}
            value={String(filters.days)}
            onChange={(v) => setFilters({ ...filters, days: parseInt(v) })}
          />
        </div>
      </div>

      {/* Regional Overview */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">ภาพรวมตามภูมิภาค</h2>
        <RegionalRiskCards
          regions={data.regions}
          onSelectRegion={(regionCode) => setFilters({ ...filters, region: regionCode })}
        />
      </section>

      {/* University Table */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          รายละเอียดแต่ละมหาวิทยาลัย
        </h2>
        <UniversityRiskTable universities={data.universities} />
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

function KPICard({
  icon,
  iconBg,
  label,
  value,
  suffix,
  valueColor = "text-gray-900",
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  suffix: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide truncate">{label}</div>
          <div className={`text-2xl font-black ${valueColor}`}>
            {value}
            <span className="text-sm text-gray-400 font-normal">{suffix}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-16 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              value === opt.value
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
