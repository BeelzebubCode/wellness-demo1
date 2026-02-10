// src/features/dashboard/ministry/components/HeatMapDashboard.tsx
"use client";

import { useState } from "react";
import { useRiskMetrics } from "../hooks/useRiskMetrics";
import { RegionalRiskCards } from "./RegionalRiskCards";
import { UniversityRiskTable } from "./UniversityRiskTable";
import { AlertTriangle, TrendingUp, Users, Clock } from "lucide-react";

export function HeatMapDashboard() {
  const [filters, setFilters] = useState({
    region: "",
    type: "",
    days: 7,
  });

  const { data, isLoading, error } = useRiskMetrics(filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-600 font-medium">เกิดข้อผิดพลาด: {error}</div>
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
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ แผนที่ความเสี่ยง
          </h1>
          <p className="text-gray-600">
            วิเคราะห์และเปรียบเทียบระดับความเสี่ยงของแต่ละมหาวิทยาลัยและภูมิภาค
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Risk Score เฉลี่ย</div>
                <div className="text-2xl font-black text-gray-900">
                  {avgRiskScore.toFixed(1)}
                  <span className="text-sm text-gray-500 font-normal">/100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">มหาลัยเสี่ยงสูง</div>
                <div className="text-2xl font-black text-red-600">
                  {criticalUniversities}
                  <span className="text-sm text-gray-500 font-normal"> แห่ง</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">คิวรวมทั้งหมด</div>
                <div className="text-2xl font-black text-gray-900">
                  {totalQueue.toLocaleString()}
                  <span className="text-sm text-gray-500 font-normal"> เคส</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">รอเฉลี่ย</div>
                <div className="text-2xl font-black text-gray-900">
                  {avgWaitTime.toFixed(1)}
                  <span className="text-sm text-gray-500 font-normal"> วัน</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">
                ภูมิภาค
              </label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">ทั้งหมด</option>
                <option value="NORTH">ภาคเหนือ</option>
                <option value="NORTHEAST">ภาคตะวันออกเฉียงเหนือ</option>
                <option value="CENTRAL">ภาคกลาง</option>
                <option value="SOUTH">ภาคใต้</option>
                <option value="EAST">ภาคตะวันออก</option>
                <option value="WEST">ภาคตะวันตก</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">
                ประเภท
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">ทั้งหมด</option>
                <option value="PUBLIC">รัฐบาล</option>
                <option value="PRIVATE">เอกชน</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">
                ช่วงเวลา
              </label>
              <select
                value={filters.days}
                onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) })}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7">7 วันที่แล้ว</option>
                <option value="30">30 วันที่แล้ว</option>
                <option value="90">90 วันที่แล้ว</option>
              </select>
            </div>

            <div className="ml-auto text-xs text-gray-500">
              แสดง <span className="font-bold">{data.metadata.totalUniversities}</span> มหาวิทยาลัย
            </div>
          </div>
        </div>

        {/* Regional Overview */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">ภาพรวมตามภูมิภาค</h2>
          <RegionalRiskCards
            regions={data.regions}
            onSelectRegion={(regionCode) => setFilters({ ...filters, region: regionCode })}
          />
        </div>

        {/* University Table */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            รายละเอียดแต่ละมหาวิทยาลัย
          </h2>
          <UniversityRiskTable universities={data.universities} />
        </div>
      </div>
    </div>
  );
}
