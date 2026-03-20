"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Clock } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryFilterStack, StoryChipGroup } from "../../widgets/story/StoryFilterChips";
import { DatePresetBar } from "../../shared/StoryUI";
import { getDateRange, SERVICE_MODE_OPTIONS, type DatePreset, type DateRange } from "../../shared/story-utils";
import { getPeakHoursMetrics } from "../actions";

interface PeakHourData {
  day: string;
  dow: number;
  count: number;
}

export function PeakHoursCard({ delay = 0 }: { delay?: number }) {
  const [date, setDate] = useState<DatePreset>("3m");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [data, setData] = useState<PeakHourData[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceModes, setServiceModes] = useState<string[]>([]);

  // Derived filter values
  const fetchKey = useMemo(() => {
    let from = "";
    let to = "";
    if (date !== "custom") {
      const range = getDateRange(date);
      if (range.allTime) {
        from = "";
        to = "";
      } else {
        from = range.start ? new Date(range.start).toISOString() : "";
        to = range.end ? new Date(range.end).toISOString() : "";
      }
    } else if (customRange?.start) {
      from = new Date(customRange.start).toISOString();
      if (customRange.end) to = new Date(customRange.end).toISOString();
    }
    return JSON.stringify({ from, to, serviceModes });
  }, [date, customRange, serviceModes]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const parsed = JSON.parse(fetchKey);
        const activeModes = parsed.serviceModes.length > 0 ? parsed.serviceModes.map(Number) : undefined;
        const result = await getPeakHoursMetrics(parsed.from, parsed.to, activeModes);
        if (cancelled) return;
        setData(result);
      } catch { /* silent */ } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [fetchKey]);

  // Insights
  const maxDay = data.reduce((prev, current) => (prev.count > current.count) ? prev : current, { day: "-", count: 0 });
  const total = data.reduce((sum, current) => sum + current.count, 0);

  const narration = loading
    ? "กำลังโหลด..."
    : total === 0
      ? "ยังไม่มีข้อมูลการจองในช่วงเวลานี้"
      : `วันที่มีการจองคิวแน่นที่สุดคือวัน${maxDay.day} (${maxDay.count.toLocaleString()} เคส)`;

  return (
    <DataStoryCard
      icon={<Clock className="w-5 h-5" />}
      iconGradient="bg-gradient-to-br from-indigo-400 to-indigo-600"
      title="ช่วงเวลาคิวแน่น (Peak Hours)"
      description="ดูปริมาณการจองคิวแยกตามวันในสัปดาห์ เพื่อช่วยจัดเรียงตารางเวรให้ Consultant เข้ามาสแตนด์บายรับมือได้อย่างเพียงพอ"
      narration={narration}
      datePreset={date}
      customRange={customRange}
      kpis={!loading ? [
        { label: "วันคิวแน่นสุด", value: maxDay.day, color: "#4f46e5" },
        { label: "เคสรวม", value: total.toLocaleString(), color: "#3b82f6" },
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
      <div className="h-52 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              itemStyle={{ color: "#334155", fontWeight: "bold" }}
            />
            <Bar dataKey="count" name="จำนวนเคส" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.count === maxDay.count && entry.count > 0 ? "#4f46e5" : "#cbd5e1"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DataStoryCard>
  );
}
