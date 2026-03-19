// features/dashboard/head-consultant/components/ResponseTimeCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ⏱️ Data Story: ประสิทธิภาพการตอบสนอง — SLA metrics + date filter + narration
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { Clock, Zap, AlertCircle, CheckCircle, ArrowRight, UserCheck, CalendarPlus, CheckSquare } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryFilterStack, StoryChipGroup } from "../../widgets/story/StoryFilterChips";
import { DatePresetBar } from "../../shared/StoryUI";
import { getDateRange, RISK_LEVEL_OPTIONS, type DatePreset, type DateRange } from "../../shared/story-utils";
import { getResponseTimeMetrics } from "../actions";

interface ResponseTimeData {
  avgAssignmentHours: number;
  avgConsultationHours: number;
  overdueCount: number;
}

function formatHours(hours: number): string {
  if (hours === 0) return "—";
  const h = Math.abs(hours);
  if (h < 1) return `${Math.round(h * 60)} นาที`;
  if (h < 24) return `${h.toFixed(1)} ชม.`;
  const days = Math.floor(h / 24);
  const rem = Math.round(h % 24);
  return rem > 0 ? `${days} วัน ${rem} ชม.` : `${days} วัน`;
}

export function ResponseTimeCard({ delay = 0 }: { delay?: number }) {
  const [date, setDate] = useState<DatePreset>("3m");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [data, setData] = useState<ResponseTimeData>({ avgAssignmentHours: 0, avgConsultationHours: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(true);
  const [riskLevels, setRiskLevels] = useState<string[]>([]);

  const fetchKey = JSON.stringify({ date, customRange, riskLevels });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const dr = getDateRange(date, customRange);
        const risks = riskLevels.map(r => parseInt(r, 10));
        const result = await getResponseTimeMetrics(
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

  const { avgAssignmentHours, avgConsultationHours, overdueCount } = data;

  // Smart narration
  const assignGood = avgAssignmentHours <= 24;
  const completeGood = avgConsultationHours <= 48; // Assume 48h is a good metric for active consultation
  const narration = loading
    ? "กำลังโหลด..."
    : `เฉลี่ยจัดสรร ${formatHours(avgAssignmentHours)}${assignGood ? " (ดี)" : " [!] เกิน 24 ชม."} — เฉลี่ยดูแลเคส ${formatHours(avgConsultationHours)}${completeGood ? " (ดี)" : " [!] นานผิดปกติ"}${overdueCount > 0 ? ` — [!] ${overdueCount} เคสรอจัดสรรเกิน 48 ชม.` : " — ไม่มีเคสค้าง"}`;

  return (
    <DataStoryCard
      icon={<Clock className="w-5 h-5" />}
      iconGradient="bg-gradient-to-br from-amber-500 to-orange-600"
      title="ประสิทธิภาพการตอบสนอง (Response Time)"
      description="ประเมินระยะเวลาการรอของนิสิตตั้งแต่เริ่มจองจนถึงตอนได้รับคำปรึกษา เพื่อลดปัญหาคอขวดและจัดสรรให้ทันท่วงที"
      narration={narration}
      kpis={!loading ? [
        { label: "จัดสรร", value: formatHours(avgAssignmentHours), color: "#3b82f6" },
        { label: "ปิดเคส", value: formatHours(avgConsultationHours), color: "#10b981" },
        ...(overdueCount > 0 ? [{ label: "ค้าง", value: overdueCount, color: "#ef4444" }] : []),
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
      {/* ── Timeline Flow ─────────────────────────────────── */}
      <div className="mt-4 mb-8">
        <div className="flex items-center w-full justify-between">
          
          {/* Step 1: Student Books */}
          <div className="flex flex-col items-center w-24 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center z-10 border-2 border-slate-200 shadow-sm">
              <CalendarPlus className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-xs font-bold text-slate-600 mt-2 text-center leading-tight">นิสิตส่งคำขอ<br/>นัดหมาย</span>
          </div>

          {/* Arrow & Time 1 */}
          <div className="flex-1 flex flex-col items-center px-2 relative -mt-6">
            <div className={`text-xl font-black ${assignGood ? 'text-blue-600' : 'text-red-500'} mb-1`}>
              {formatHours(avgAssignmentHours)}
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full relative overflow-hidden">
              <div className={`absolute inset-0 ${assignGood ? 'bg-blue-400' : 'bg-red-400'} rounded-full w-full`} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-wide">เวลาจัดสรร (SLA 24 ชม.)</span>
          </div>

          {/* Step 2: Assigned */}
          <div className="flex flex-col items-center w-24 shrink-0">
            <div className={`w-12 h-12 rounded-2xl ${assignGood ? 'bg-blue-100 border-blue-200' : 'bg-red-100 border-red-200'} flex items-center justify-center z-10 border-2 shadow-sm`}>
              <UserCheck className={`w-5 h-5 ${assignGood ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
            <span className="text-xs font-bold text-slate-600 mt-2 text-center leading-tight">จัดสรร<br/>Consultant</span>
          </div>

          {/* Arrow & Time 2 */}
          <div className="flex-1 flex flex-col items-center px-2 relative -mt-6">
            <div className={`text-xl font-black ${completeGood ? 'text-emerald-600' : 'text-amber-500'} mb-1`}>
              {formatHours(avgConsultationHours)}
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full relative overflow-hidden">
              <div className={`absolute inset-0 ${completeGood ? 'bg-emerald-400' : 'bg-amber-400'} rounded-full w-full`} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-wide">เวลาเฉลี่ยให้คำปรึกษาจริง/แต่ละเคสใช้เวลาเท่าไหร่</span>
          </div>

          {/* Step 3: Completed */}
          <div className="flex flex-col items-center w-24 shrink-0">
            <div className={`w-12 h-12 rounded-2xl ${completeGood ? 'bg-emerald-100 border-emerald-200' : 'bg-red-100 border-red-200'} flex items-center justify-center z-10 border-2 shadow-sm`}>
              <CheckSquare className={`w-5 h-5 ${completeGood ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <span className="text-xs font-bold text-slate-600 mt-2 text-center leading-tight">ปิดเคส<br/>สำเร็จ</span>
          </div>

        </div>
      </div>

      {/* ── Overdue Alert Box ───────────────────────────── */}
      <div className={`px-5 py-4 rounded-xl border flex items-center justify-between transition-colors ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${overdueCount > 0 ? 'bg-red-100' : 'bg-slate-200'}`}>
            <AlertCircle className={`w-5 h-5 ${overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className={`text-sm font-black ${overdueCount > 0 ? 'text-red-800' : 'text-slate-700'}`}>
              เคสรอนานเกิน 48 ชั่วโมง (ยังไม่ได้จัดสรร)
            </p>
            <p className={`text-xs mt-0.5 ${overdueCount > 0 ? 'text-red-600/80' : 'text-slate-500'}`}>
              {overdueCount > 0 ? 'ควรเร่งจัดสรร Consultant ให้โดยเร็วที่สุด เพื่อไม่ให้นิสิตรอเก้อ' : 'ไม่มีเคสค้างจัดสรรนานเกินกำหนด ทำได้เยี่ยมมาก!'}
            </p>
          </div>
        </div>
        <div className={`text-3xl font-black tabular-nums ${overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
          {overdueCount} <span className="text-sm font-bold text-opacity-50 uppercase tracking-widest">เคส</span>
        </div>
      </div>
    </DataStoryCard>
  );
}
