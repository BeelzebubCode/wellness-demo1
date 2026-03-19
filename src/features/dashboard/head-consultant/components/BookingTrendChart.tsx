// features/dashboard/head-consultant/components/BookingTrendChart.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 📈 Data Story: แนวโน้มเคสรายสัปดาห์ — area chart + date filter + narration
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryFilterStack, StoryChipGroup } from "../../widgets/story/StoryFilterChips";
import { DatePresetBar } from "../../shared/StoryUI";
import { getDateRange, Tip, SERVICE_MODE_OPTIONS, type DatePreset, type DateRange } from "../../shared/story-utils";
import { getBookingTrend } from "../actions";

interface TrendItem {
  week: string;
  total: number;
  completed: number;
  cancelled: number;
}

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatWeek(w: string) {
  const d = new Date(w);
  if (isNaN(d.getTime())) return w;
  return `${d.getDate()} ${MONTHS_TH[d.getMonth()]}`;
}

export function BookingTrendChart({ delay = 0 }: { delay?: number }) {
  const [date, setDate] = useState<DatePreset>("3m");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [data, setData] = useState<TrendItem[]>([]);
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
        const result = await getBookingTrend(
          dr.allTime ? undefined : dr.start,
          dr.allTime ? undefined : dr.end,
          modes.length > 0 ? modes : undefined
        );
        if (cancelled) return;
        setData(result);
      } catch { /* silent */ } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [fetchKey]);

  const chartData = useMemo(() =>
    data.map((d) => ({ ...d, label: formatWeek(d.week) })),
    [data]
  );

  const totalBookings = data.reduce((s, d) => s + d.total, 0);
  const totalCompleted = data.reduce((s, d) => s + d.completed, 0);
  const totalCancelled = data.reduce((s, d) => s + d.cancelled, 0);
  const completionRate = totalBookings > 0 ? Math.round((totalCompleted / totalBookings) * 100) : 0;

  // Trend direction: compare last 2 data points
  const trendDir = useMemo(() => {
    if (data.length < 2) return "flat";
    const last = data[data.length - 1].total;
    const prev = data[data.length - 2].total;
    if (last > prev) return "up";
    if (last < prev) return "down";
    return "flat";
  }, [data]);

  const TrendIcon = trendDir === "up" ? TrendingUp : trendDir === "down" ? TrendingDown : Minus;

  const narration = loading
    ? "กำลังโหลด..."
    : data.length === 0
      ? "ยังไม่มีข้อมูลแนวโน้ม"
      : `จองรวม ${totalBookings.toLocaleString()} เคส — สำเร็จ ${completionRate}% — ${trendDir === "up" ? "[ขึ้น] เคสเพิ่มขึ้น" : trendDir === "down" ? "[ลง] เคสลดลง" : "[ทรงตัว]"}จากสัปดาห์ก่อน`;

  return (
    <DataStoryCard
      icon={<TrendingUp className="w-5 h-5" />}
      iconGradient="bg-gradient-to-br from-violet-500 to-fuchsia-600"
      title="แนวโน้มความต้องการ (Booking Trend)"
      description="ติดตามปริมาณนิสิตที่เข้ามาจองในแต่ละสัปดาห์ เพื่อคาดเดาช่วงเวลาที่คิวแน่น (Peak Period) และเตรียม Consultant ให้พร้อม"
      narration={narration}
      kpis={!loading ? [
        { label: "เคสทั้งหมด", value: totalBookings, color: "#3b82f6" },
        { label: "สำเร็จ", value: totalCompleted, color: "#10b981" },
        { label: "ยกเลิก", value: totalCancelled, color: "#f59e0b" },
        { label: "สำเร็จ %", value: `${completionRate}%`, color: "#8b5cf6" },
      ] : undefined}
      filters={
        <StoryFilterStack>
          <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} />
          <StoryChipGroup label="รูปแบบบริการ" options={SERVICE_MODE_OPTIONS} selected={serviceModes} onChange={setServiceModes} />
        </StoryFilterStack>
      }
      delay={delay}
      loading={loading}
    >
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ left: -15, right: 8 }}>
            <defs>
              <linearGradient id="hcGradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hcGradCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hcGradCancelled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} />
            <Legend iconType="circle" formatter={(v: string) => {
              const map: Record<string, string> = { total: "ทั้งหมด", completed: "สำเร็จ", cancelled: "ยกเลิก" };
              return <span className="text-[10px] text-slate-500 font-medium">{map[v] ?? v}</span>;
            }} />
            <Area type="monotone" dataKey="total" name="total" stroke="#3b82f6" strokeWidth={2} fill="url(#hcGradTotal)" dot={{ r: 2, fill: "#3b82f6" }} />
            <Area type="monotone" dataKey="completed" name="completed" stroke="#10b981" strokeWidth={2} fill="url(#hcGradCompleted)" dot={{ r: 2, fill: "#10b981" }} />
            <Area type="monotone" dataKey="cancelled" name="cancelled" stroke="#f59e0b" strokeWidth={2} fill="url(#hcGradCancelled)" dot={{ r: 2, fill: "#f59e0b" }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </DataStoryCard>
  );
}
