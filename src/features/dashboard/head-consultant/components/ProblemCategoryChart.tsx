// features/dashboard/head-consultant/components/ProblemCategoryChart.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 📋 Data Story: ประเภทปัญหา — donut chart + filters + narration
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FolderKanban } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryFilterStack, StoryChipGroup } from "../../widgets/story/StoryFilterChips";
import { DatePresetBar } from "../../shared/StoryUI";
import { getDateRange, RISK_LEVEL_OPTIONS, type DatePreset, type DateRange } from "../../shared/story-utils";
import { getCategoryDistribution } from "../actions";
import type { CategoryItem } from "../hooks/useHeadConsultantDashboard";

const CATEGORY_COLORS = [
  "#4f46e5", // Indigo
  "#0ea5e9", // Sky
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#64748b", // Slate
];

export function ProblemCategoryChart({ delay = 0, categories: initialCategories }: { delay?: number; categories?: CategoryItem[] }) {
  const [date, setDate] = useState<DatePreset>("3m");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [data, setData] = useState<CategoryItem[]>(initialCategories ?? []);
  const [loading, setLoading] = useState(!initialCategories?.length);
  const [riskLevels, setRiskLevels] = useState<string[]>([]);
  const prevFetchKey = React.useRef("");

  const fetchKey = JSON.stringify({ date, customRange, riskLevels });

  useEffect(() => {
    // If we have initial data and fetchKey hasn't changed (first mount), skip fetching
    if (initialCategories && initialCategories.length > 0 && loading === false && prevFetchKey.current === fetchKey) return;
    prevFetchKey.current = fetchKey;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const dr = getDateRange(date, customRange);
        const risks = riskLevels.map(r => parseInt(r, 10));
        const result = await getCategoryDistribution(
          dr.allTime ? undefined : dr.start,
          dr.allTime ? undefined : dr.end,
          risks.length > 0 ? risks : undefined
        );
        if (cancelled) return;
        setData(result);
      } catch { /* silent */ } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [fetchKey]);

  const total = data.reduce((s, c) => s + c.count, 0);

  // Take top 8 categories
  const chartData = data.slice(0, 8).map((c, i) => ({
    name: c.nameTh,
    value: c.count,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const topCategory = chartData[0];
  const topPct = topCategory && total > 0 ? Math.round((topCategory.value / total) * 100) : 0;

  const narration = loading
    ? "กำลังโหลด..."
    : total === 0
      ? "ยังไม่มีข้อมูลประเภทปัญหา"
      : `พบปัญหาแยกได้ ${data.length} ประเภทจาก ${total.toLocaleString()} เคส — อันดับ 1 คือ ${topCategory.name} (${topPct}%)`;

  return (
    <DataStoryCard
      icon={<PieChart className="w-5 h-5" />}
      iconGradient="bg-gradient-to-br from-cyan-500 to-blue-600"
      title="ปัญหาที่พบบ่อย (Problem Categories)"
      description="สรุปหัวข้อความเครียด/ปัญหาหลักๆ ที่นิสิตเจอ เพื่อใช้วางแผนจัดอบรมเพิ่มเติม หรือปรับแนวทางช่วยเหลือระดับมหาลัย"
      narration={narration}
      datePreset={date}
      customRange={customRange}
      kpis={!loading && topCategory ? [
        { label: "เคสทั้งหมด", value: total, color: "#3b82f6" },
        { label: "หมวดหมู่", value: data.length, color: "#8b5cf6" },
        { label: "อันดับ 1", value: topCategory.name, color: topCategory.color },
      ] : undefined}
      filters={
        <StoryFilterStack>
          <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} />
          <StoryChipGroup label="ระดับความเสี่ยง" options={RISK_LEVEL_OPTIONS} selected={riskLevels} onChange={setRiskLevels} />
        </StoryFilterStack>
      }
      delay={delay}
      loading={loading}
    >
      {chartData.length > 0 && (
        <div className="flex items-center gap-4">
          {/* Donut Chart */}
          <div className="flex-1 min-w-0">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {chartData.map((entry, i) => (
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
          <div className="w-48 shrink-0 space-y-1.5 custom-scrollbar overflow-y-auto max-h-[210px] pr-2">
            {chartData.map((d, i) => {
              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[11px] flex-1 font-medium text-slate-600 truncate" title={d.name}>
                    {d.name.length > 15 ? d.name.substring(0, 15) + "…" : d.name}
                  </span>
                  <span className="text-[12px] font-bold text-slate-700 tabular-nums">{d.value}</span>
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
