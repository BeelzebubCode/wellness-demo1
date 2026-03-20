// features/dashboard/head-consultant/components/AttendanceInsightsCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 🏥 Data Story: สถิติการเข้าพบ — bar chart + date filter + narration
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { UserCheck, AlertTriangle, ShieldCheck, CheckCircle, Clock, XCircle, Ban, Hourglass } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryFilterStack, StoryChipGroup } from "../../widgets/story/StoryFilterChips";
import { DatePresetBar } from "../../shared/StoryUI";
import { getDateRange, SERVICE_MODE_OPTIONS, type DatePreset, type DateRange } from "../../shared/story-utils";
import { getAttendanceInsights } from "../actions";

interface AttendanceData {
  checkedIn: number;
  late: number;
  noShow: number;
  pending: number;
  cancelledByConsultant: number;
  pendingExceptions: number;
}

const STATUS_META = [
  { key: "checkedIn", label: "มาตรงนัด", color: "#10b981", Icon: CheckCircle },
  { key: "late", label: "มาสาย", color: "#f59e0b", Icon: Clock },
  { key: "noShow", label: "ไม่มาตามนัด", color: "#ef4444", Icon: XCircle },
  { key: "cancelledByConsultant", label: "Consultant ยกเลิก", color: "#8b5cf6", Icon: Ban },
  { key: "pending", label: "รอตรวจสอบ", color: "#94a3b8", Icon: Hourglass },
] as const;

export function AttendanceInsightsCard({ delay = 0 }: { delay?: number }) {
  const [date, setDate] = useState<DatePreset>("3m");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [data, setData] = useState<AttendanceData>({
    checkedIn: 0, late: 0, noShow: 0, pending: 0, cancelledByConsultant: 0, pendingExceptions: 0,
  });
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
        const result = await getAttendanceInsights(
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

  const total = data.checkedIn + data.late + data.noShow + data.cancelledByConsultant + data.pending;
  const noShowRate = total > 0 ? Math.round((data.noShow / total) * 100) : 0;
  const onTimeRate = total > 0 ? Math.round((data.checkedIn / total) * 100) : 0;

  const chartData = useMemo(() =>
    STATUS_META.map((s) => ({
      name: s.label,
      value: data[s.key as keyof AttendanceData] as number,
      color: s.color,
      Icon: s.Icon,
    })).filter((d) => d.value > 0),
    [data]
  );

  const narration = loading
    ? "กำลังโหลด..."
    : total === 0
      ? "ยังไม่มีข้อมูลการเข้าพบ"
      : `เข้าพบรวม ${total} ครั้ง — มาตรงนัด ${onTimeRate}% — ขาดนัด ${noShowRate}%${noShowRate > 15 ? " [!] อัตราขาดนัดสูง" : noShowRate > 0 ? "" : " ไม่มีขาดนัด"}${data.pendingExceptions > 0 ? ` — ${data.pendingExceptions} exception รอ review` : ""}`;

  return (
    <DataStoryCard
      icon={<UserCheck className="w-5 h-5" />}
      iconGradient="bg-gradient-to-br from-teal-500 to-emerald-600"
      title="อัตราการเข้าพบ (Attendance)"
      description="มอนิเตอร์พฤติกรรมการมาตามนัดหมาย ถ้านิสิตเทคิว (No-show) หรือมาสายเยอะ อาจต้องปรับระบบแจ้งเตือนให้เข้มขึ้น"
      narration={narration}
      datePreset={date}
      customRange={customRange}
      kpis={!loading ? [
        { label: "ตรงนัด", value: data.checkedIn, color: "#10b981" },
        { label: "ขาดนัด", value: data.noShow, color: "#ef4444" },
        { label: "มาสาย", value: data.late, color: "#f59e0b" },
        { label: "ขาดนัด %", value: `${noShowRate}%`, color: noShowRate > 15 ? "#ef4444" : "#64748b" },
      ] : undefined}
      headerBadge={
        data.pendingExceptions > 0 ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-black text-amber-600">{data.pendingExceptions} exception</span>
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
      {chartData.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">สถานะการเข้าพบ</p>
          <ResponsiveContainer width="100%" height={Math.max(150, chartData.length * 36 + 20)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40 }}>
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                width={110}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div className="bg-slate-900/95 backdrop-blur rounded-xl shadow-2xl px-4 py-2.5 text-xs border border-white/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <d.Icon className="w-3 h-3" style={{ color: d.color }} />
                        <p className="font-bold text-white">{d.name}</p>
                      </div>
                      <p className="text-white/70">{d.value} ครั้ง ({pct}%)</p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="value"
                name="จำนวน"
                radius={[0, 8, 8, 0]}
                barSize={20}
                label={({ x, y, width, height, value }: any) => (
                  <text
                    x={x + width + 5}
                    y={y + height / 2}
                    fill="#475569"
                    fontSize={11}
                    dominantBaseline="middle"
                    fontWeight={700}
                  >
                    {value}
                  </text>
                )}
              >
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Quick insight */}
          {total > 0 && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${noShowRate > 15 ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-100"}`}>
              {noShowRate > 15 ? (
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <p className={`text-[11px] font-bold ${noShowRate > 15 ? "text-red-700" : "text-emerald-700"}`}>
                {noShowRate > 15
                  ? `อัตราขาดนัดอยู่ที่ ${noShowRate}% — ควรติดตามนิสิตที่ขาดนัดบ่อย`
                  : `อัตราเข้าพบตรงนัด ${onTimeRate}% — อยู่ในเกณฑ์ดี`
                }
              </p>
            </div>
          )}
        </div>
      ) : (
        !loading && (
          <div className="h-32 flex items-center justify-center text-sm text-slate-400">
            ยังไม่มีข้อมูลการเข้าพบ
          </div>
        )
      )}
    </DataStoryCard>
  );
}
