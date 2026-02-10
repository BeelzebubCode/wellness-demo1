// src/features/dashboard/ministry/components/RegionalRiskCards.tsx
"use client";

import { RegionalRiskMetrics } from "../hooks/useRiskMetrics";

interface Props {
  regions: RegionalRiskMetrics[];
  onSelectRegion?: (regionCode: string) => void;
}

export function RegionalRiskCards({ regions, onSelectRegion }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "critical":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
        return "🟢";
      case "warning":
        return "🟡";
      case "critical":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "normal":
        return "ปกติ";
      case "warning":
        return "ระวัง";
      case "critical":
        return "เสี่ยง";
      default:
        return "ไม่ทราบ";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {regions.map((region) => (
        <button
          key={region.regionCode}
          onClick={() => onSelectRegion?.(region.regionCode)}
          className={`
            text-left p-5 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-[1.02]
            ${getStatusColor(region.status)}
          `}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg">{region.regionName}</h3>
              <p className="text-xs opacity-70 mt-1">
                {region.totalUniversities} มหาวิทยาลัย
              </p>
            </div>
            <div className="text-3xl">{getStatusIcon(region.status)}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black">
                {region.avgRiskScore.toFixed(1)}
              </span>
              <span className="text-xs font-medium opacity-70">
                คะแนนเสี่ยง / 100
              </span>
            </div>

            <div className="pt-2 border-t border-current opacity-30" />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="opacity-60">คิวรวม</div>
                <div className="font-bold">{region.totalQueue} เคส</div>
              </div>
              <div>
                <div className="opacity-60">รอเฉลี่ย</div>
                <div className="font-bold">{region.avgWaitTime.toFixed(1)} วัน</div>
              </div>
            </div>

            <div className="text-xs">
              <div className="opacity-60">เสี่ยงสูง</div>
              <div className="font-bold">{region.highRiskPercentage.toFixed(1)}%</div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-current opacity-20 text-xs font-semibold text-center">
            {getStatusLabel(region.status).toUpperCase()}
          </div>
        </button>
      ))}
    </div>
  );
}
