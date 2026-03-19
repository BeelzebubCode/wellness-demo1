// features/dashboard/head-consultant/components/RiskDistributionCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 📊 Data Story: การกระจายระดับความเสี่ยง — ring chart + filters + narration
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../../widgets/story/StoryFilterChips";
import { DatePresetBar } from "../../shared/StoryUI";
import { getDateRange, SERVICE_MODE_OPTIONS, type DatePreset, type DateRange } from "../../shared/story-utils";
import { getRiskDistribution } from "../actions";

const RISK_BADGE: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-cyan-50", text: "text-cyan-700" },
  2: { bg: "bg-green-50", text: "text-green-700" },
  3: { bg: "bg-yellow-50", text: "text-yellow-700" },
  4: { bg: "bg-orange-50", text: "text-orange-700" },
  5: { bg: "bg-red-50", text: "text-red-700" },
};

interface RiskDistItem {
  riskLevelId: number | null;
  label: string;
  color: string;
  count: number;
}

export function RiskDistributionCard({ delay = 0 }: { delay?: number }) {
  const [date, setDate] = useState<DatePreset>("all");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [distribution, setDistribution] = useState<RiskDistItem[]>([]);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [serviceModes, setServiceModes] = useState<string[]>([]);

  const fetchKey = JSON.stringify({ date, customRange, serviceModes });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const dr = getDateRange(date, customRange);
        const modes = serviceModes.map(m => parseInt(m, 10));
        const result = await getRiskDistribution(
          dr.allTime ? undefined : dr.start,
          dr.allTime ? undefined : dr.end,
          modes.length > 0 ? modes : undefined
        );
        if (cancelled) return;
        setDistribution(result.distribution);
        setHighRiskCount(result.highRiskCount);
      } catch { /* silent */ } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [fetchKey]);

  const total = distribution.reduce((s, d) => s + d.count, 0);
  const highPct = total > 0 ? Math.round((highRiskCount / total) * 100) : 0;

  const pieData = distribution.map((d) => ({
    name: d.label,
    value: d.count,
    color: d.color,
    riskLevelId: d.riskLevelId,
  }));

  const narration = loading
    ? "กำลังโหลด..."
    : total === 0
      ? "ยังไม่มีข้อมูลการประเมินความเสี่ยง"
      : `ประเมินความเสี่ยงทั้งหมด ${total.toLocaleString()} ครั้ง — ระดับสูง/สูงมาก ${highRiskCount} ครั้ง (${highPct}%)${highRiskCount > 3 ? " [!] ควรเร่งติดตาม" : ""}`;

  return (
    <DataStoryCard
      icon={<AlertTriangle className="w-5 h-5" />}
      iconGradient="bg-gradient-to-br from-rose-500 to-red-600"
      title="การกระจายตัวระดับความเสี่ยง"
      description="ดูสัดส่วนนิสิตที่ประเมินแล้วตกอยู่ในเกณฑ์เสี่ยงแต่ละระดับ เพื่อเน้นโฟกัสดูแลกลุ่มเปราะบาง (วิกฤต/เสี่ยงสูง) ก่อน"
      narration={narration}
      kpis={!loading ? [
        { label: "ประเมินรวม", value: total, color: "#4f46e5" },
        { label: "สูง/วิกฤต", value: highRiskCount, color: "#f43f5e" },
        { label: "อัตราสูง", value: `${highPct}%`, color: "#f59e0b" },
      ] : undefined}
      headerBadge={
        highRiskCount > 0 ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 border border-red-200 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-black text-red-600">{highRiskCount} เสี่ยงสูง</span>
          </div>
        ) : undefined
      }
      filters={
        <StoryFilterStack>
          <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} />
          <StoryChipGroup label="รูปแบบบริการ" options={SERVICE_MODE_OPTIONS} selected={serviceModes} onChange={setServiceModes} />
        </StoryFilterStack>
      }
      delay={delay}
      loading={loading}
    >
      {total > 0 && (
        <div className="flex items-center gap-4">
          {/* Donut */}
          <div className="flex-1 min-w-0">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                    return (
                      <div className="bg-slate-900/95 backdrop-blur rounded-xl shadow-2xl px-4 py-2.5 text-xs border border-white/10">
                        <p className="font-bold text-white mb-1">{d.name}</p>
                        <p className="text-white/70">{d.value.toLocaleString()} ครั้ง ({pct}%)</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="w-44 shrink-0 space-y-1.5">
            {distribution.map((d, i) => {
              const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
              const colors = d.riskLevelId ? RISK_BADGE[d.riskLevelId] : { bg: "bg-slate-50", text: "text-slate-600" };
              return (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors?.bg ?? "bg-slate-50"}`}>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className={`text-[11px] flex-1 font-medium ${colors?.text ?? "text-slate-600"}`}>{d.label}</span>
                  <span className="text-[12px] font-bold text-slate-700 tabular-nums">{d.count}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DataStoryCard>
  );
}
