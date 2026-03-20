// src/features/dashboard/dean/components/UnifiedDepartmentDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Department detail view — story-card pattern with clean UX
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useEffect } from "react";
import {
  ArrowLeft, Users, BookOpen, Activity, TrendingUp,
  GraduationCap, AlertTriangle, Shield,
} from "lucide-react";
import { DepartmentStat } from "./DepartmentListing";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  XAxis, YAxis, CartesianGrid, AreaChart, Area,
  BarChart, Bar,
} from "recharts";

interface Props {
  department: DepartmentStat;
  facultyName: string;
  universityName: string;
  onBack: () => void;
  onBackToList?: () => void;
}

const RISK_COLORS = ["#ef4444", "#10b981"];

export function UnifiedDepartmentDashboard({
  department,
  facultyName,
  universityName,
  onBack,
}: Props) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const riskData = department.riskData || [];
  const trendData = department.trendData || [];
  const topProblems = department.topProblems || [];
  const totalRisk = riskData.reduce((a, b) => a + b.value, 0);
  const highRisk = riskData.find(r => r.name.includes("วิกฤต"))?.value ?? 0;

  return (
    <div className="min-h-screen pb-16">
      <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-6 space-y-5">
        {/* ── Back + Header ── */}
        <div className="animate-[fadeUp_0.4s_ease-out_both]">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all text-sm font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            กลับหน้ารายการภาควิชา
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-9 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              {department.name}
            </h1>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">
              {department.code}
            </span>
          </div>
          <p className="text-sm text-slate-400 ml-4">
            {facultyName} — {universityName}
          </p>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-[fadeUp_0.4s_ease-out_both]" style={{ animationDelay: "50ms" }}>
          <KpiCard
            icon={<Users className="w-4 h-4" />}
            gradient="from-blue-500 to-blue-600"
            label="นิสิตทั้งหมด"
            value={department.students.toLocaleString()}
            unit="คน"
          />
          <KpiCard
            icon={<BookOpen className="w-4 h-4" />}
            gradient="from-indigo-500 to-violet-600"
            label="การเข้าปรึกษา"
            value={department.sessions.toLocaleString()}
            unit="ครั้ง"
          />
          <KpiCard
            icon={<Activity className="w-4 h-4" />}
            gradient="from-emerald-500 to-teal-600"
            label="เฉลี่ยต่อคน"
            value={department.perStudent.toFixed(2)}
            unit="ครั้ง/คน"
          />
          <KpiCard
            icon={<AlertTriangle className="w-4 h-4" />}
            gradient="from-red-500 to-rose-600"
            label="ความเสี่ยงสูง"
            value={highRisk.toString()}
            unit="คน"
          />
        </div>

        {/* ── Row 1: Risk Donut + Trend ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Risk */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-sm p-5 animate-[fadeUp_0.4s_ease-out_both]" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">สถานะความเสี่ยง</h3>
                <p className="text-[10px] text-slate-400">สัดส่วนนิสิตตามระดับ</p>
              </div>
            </div>

            <div className="relative h-[180px]">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{totalRisk}</span>
                <span className="text-[10px] text-slate-400 font-bold">คน</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                    {riskData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xl text-xs">
                          <p className="font-bold text-slate-700">{d.name}</p>
                          <p className="text-slate-500">{d.value} คน</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-4 mt-2">
              {riskData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-bold text-slate-500">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trend */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white shadow-sm p-5 animate-[fadeUp_0.4s_ease-out_both]" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 grid place-items-center shadow">
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">แนวโน้มการเข้ารับคำปรึกษา</h3>
                <p className="text-[10px] text-slate-400">รายเดือน (6 เดือนล่าสุด)</p>
              </div>
            </div>

            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      return (
                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xl text-xs">
                          <p className="font-bold text-slate-700">{payload[0].payload.month}</p>
                          <p className="text-indigo-600">{payload[0].value} ครั้ง</p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#trendGrad)"
                    dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-slate-300">
                ยังไม่มีข้อมูลแนวโน้ม
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Problem Categories ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 animate-[fadeUp_0.4s_ease-out_both]" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 grid place-items-center shadow">
                <GraduationCap className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">ประเภทปัญหาที่พบ</h3>
                <p className="text-[10px] text-slate-400">แยกตามเพศ — Top 5 หมวดหมู่</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Legend color="#3b82f6" label="ชาย" />
              <Legend color="#ec4899" label="หญิง" />
              <Legend color="#a855f7" label="อื่นๆ" />
            </div>
          </div>

          {topProblems.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(topProblems.length * 50, 200)}>
              <BarChart
                data={topProblems}
                layout="vertical"
                margin={{ left: 0, right: 40, top: 0, bottom: 0 }}
                barGap={0}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
                  width={120}
                  interval={0}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xl text-xs space-y-1">
                        <p className="font-bold text-slate-700">{label}</p>
                        <p><span className="text-blue-500">ชาย:</span> {d.male}</p>
                        <p><span className="text-pink-500">หญิง:</span> {d.female}</p>
                        <p><span className="text-purple-500">อื่นๆ:</span> {d.other}</p>
                        <p className="pt-1 border-t border-slate-100 font-bold text-slate-600">รวม: {d.total}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="male" stackId="a" fill="#3b82f6" radius={[2, 0, 0, 2]} barSize={16} />
                <Bar dataKey="female" stackId="a" fill="#ec4899" barSize={16} />
                <Bar dataKey="other" stackId="a" fill="#a855f7" radius={[0, 2, 2, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-300">
              ยังไม่มีข้อมูลปัญหา
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-300 py-3 animate-[fadeUp_0.4s_ease-out_both]" style={{ animationDelay: "250ms" }}>
          อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>
    </div>
  );
}

/* ── Utility ── */
function KpiCard({ icon, gradient, label, value, unit }: {
  icon: React.ReactNode; gradient: string; label: string; value: string; unit: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient} grid place-items-center shadow text-white shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-slate-800">{value}</span>
          <span className="text-[10px] text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-bold text-slate-500">{label}</span>
    </div>
  );
}
