// features/dashboard/head-consultant/components/WorkloadBalanceChart.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ⚖️ Data Story: Workload สมาชิก — horizontal bar + threshold + narration
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { Scale, RefreshCcw, AlertTriangle } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { getWorkloadBalance } from "../actions";

interface WorkloadItem {
  consultantId: number;
  name: string;
  activeCases: number;
}

const THRESHOLD = 5;

export function WorkloadBalanceChart({ delay = 0 }: { delay?: number }) {
  const [data, setData] = useState<WorkloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getWorkloadBalance();
      setData(result);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const chartData = useMemo(() =>
    data.map((d) => ({
      ...d,
      shortName: d.name.length > 18 ? d.name.substring(0, 16) + "…" : d.name,
    })),
    [data]
  );

  const maxCases = Math.max(...data.map((d) => d.activeCases), 0);
  const overloaded = data.filter((d) => d.activeCases > THRESHOLD);
  const totalActive = data.reduce((s, d) => s + d.activeCases, 0);
  const avgCases = data.length > 0 ? Math.round((totalActive / data.length) * 10) / 10 : 0;

  const narration = loading
    ? "กำลังโหลด..."
    : data.length === 0
      ? "ยังไม่มีข้อมูลสมาชิก"
      : `ทีม ${data.length} คน — เคสรวม ${totalActive} เคส — เฉลี่ย ${avgCases} เคส/คน${overloaded.length > 0 ? ` [!] ${overloaded.length} คนมีเกินเกณฑ์ (>${THRESHOLD})` : " โหลดสมดุลดี"}`;

  return (
    <DataStoryCard
      icon={<Scale className="w-5 h-5" />}
      iconGradient="bg-gradient-to-br from-slate-600 to-slate-800"
      title="ภาระงานของบุคลากร (Workload)"
      description="ดูจำนวนเคสที่อยู่ในมือของ Consultant แต่ละคน เพื่อลดภาวะ Burnout และกระจายงานให้สมดุลและเป็นธรรม"
      narration={narration}
      datePreset="all"
      kpis={!loading ? [
        { label: "สมาชิก", value: data.length, color: "#8b5cf6" },
        { label: "เคสรวม", value: totalActive, color: "#3b82f6" },
        { label: "เฉลี่ย/คน", value: avgCases, color: "#10b981" },
        ...(overloaded.length > 0 ? [{ label: "โหลดเกิน", value: overloaded.length, color: "#f97316" }] : []),
      ] : undefined}
      headerBadge={
        <button
          onClick={fetchData}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all"
        >
          <RefreshCcw className="w-3 h-3" />
          รีเฟรช
        </button>
      }
      delay={delay}
      loading={loading}
    >
      {chartData.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">เคส Active ต่อคน</p>
            {overloaded.length > 0 && (
              <span className="text-[9px] text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> เส้นประ = เกณฑ์สูงสุด ({THRESHOLD} เคส)
              </span>
            )}
          </div>
          <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
            <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 40 + 30)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40 }}>
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                domain={[0, Math.max(maxCases + 2, THRESHOLD + 2)]}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                width={120}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                x={THRESHOLD}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `เกณฑ์ (${THRESHOLD})`,
                  position: "top",
                  fill: "#f59e0b",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 backdrop-blur rounded-xl shadow-2xl px-4 py-2.5 text-xs border border-white/10">
                      <p className="font-bold text-white mb-1">{d.name}</p>
                      <p className="text-white/70">{d.activeCases} เคสที่กำลังดำเนินการ</p>
                      {d.activeCases > THRESHOLD && (
                        <p className="text-amber-400 mt-1 font-bold">[!] เกินเกณฑ์</p>
                      )}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="activeCases"
                name="เคส"
                radius={[0, 8, 8, 0]}
                barSize={22}
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
                  <Cell
                    key={idx}
                    fill={
                      entry.activeCases > THRESHOLD
                        ? "#f97316"
                        : entry.activeCases === 0
                          ? "#cbd5e1"
                          : "#8b5cf6"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      )}
    </DataStoryCard>
  );
}
