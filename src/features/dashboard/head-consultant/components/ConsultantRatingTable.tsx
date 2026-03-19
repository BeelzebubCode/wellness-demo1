// features/dashboard/head-consultant/components/ConsultantRatingTable.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 📝 Data Story: ระดับความพึงพอใจ — list + date filter + narration
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { Star, MessageSquareQuote, Award } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryFilterStack } from "../../widgets/story/StoryFilterChips";
import { DatePresetBar } from "../../shared/StoryUI";
import { getDateRange, type DatePreset, type DateRange } from "../../shared/story-utils";
import { getConsultantRatings } from "../actions";
import type { ConsultantRating } from "../hooks/useHeadConsultantDashboard";

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`${score} / ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = score >= i + 0.8;
        return (
          <Star
            key={i}
            className={`h-3 w-3 ${filled ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-50"}`}
          />
        );
      })}
    </div>
  );
}

export function ConsultantRatingTable({ delay = 0, ratings: initialRatings }: { delay?: number; ratings?: ConsultantRating[] }) {
  const [date, setDate] = useState<DatePreset>("3m");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [data, setData] = useState<ConsultantRating[]>(initialRatings ?? []);
  const [loading, setLoading] = useState(!initialRatings?.length);

  const fetchKey = JSON.stringify({ date, customRange });

  useEffect(() => {
    if (initialRatings && initialRatings.length > 0 && loading === false) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const dr = getDateRange(date, customRange);
        const result = await getConsultantRatings(
          dr.allTime ? undefined : dr.start,
          dr.allTime ? undefined : dr.end
        );
        if (cancelled) return;
        setData(result);
      } catch { /* silent */ } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [fetchKey]);

  const sorted = [...data].sort((a, b) => b.avgRating - a.avgRating);
  const totalFeedback = sorted.reduce((s, r) => s + r.feedbackCount, 0);
  const avgOverall = sorted.length > 0 ? (sorted.reduce((s, r) => s + r.avgRating, 0) / sorted.length).toFixed(1) : "0.0";
  const topCount = sorted.filter((r) => r.avgRating >= 4.5).length;

  const narration = loading
    ? "กำลังโหลด..."
    : sorted.length === 0
      ? "ยังไม่มีข้อมูลการประเมิน"
      : `ประเมินรวม ${totalFeedback.toLocaleString()} รีวิว — คะแนนเฉลี่ยทีม ${avgOverall} ดาว — มี ${topCount} คนที่ได้ 4.5+`;

  return (
    <DataStoryCard
      icon={<Star className="w-5 h-5" />}
      iconGradient="bg-gradient-to-br from-amber-400 to-orange-500"
      title="คะแนนประเมินบุคลากร (Consultant Ratings)"
      description="ดูคะแนนความพึงพอใจและคอมเมนต์จากนิสิตหลังรับคำปรึกษา เพื่อประเมินผลงานและนำไปเป็น Feedback พัฒนาทีม"
      narration={narration}
      kpis={!loading && sorted.length > 0 ? [
        { label: "รีวิวสะสม", value: totalFeedback, color: "#ec4899" },
        { label: "เฉลี่ยทีม", value: `${avgOverall} / 5`, color: "#f59e0b" },
        { label: "ระดับ 4.5+", value: `${topCount} คน`, color: "#10b981" },
      ] : undefined}
      filters={
        <StoryFilterStack>
          <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} />
        </StoryFilterStack>
      }
      delay={delay}
      loading={loading}
    >
      {sorted.length > 0 && (
        <div className="space-y-2 h-[350px] overflow-y-auto custom-scrollbar pr-2">
          {sorted.map((c) => (
            <div
              key={c.consultantId}
              className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-pink-200 hover:shadow-sm transition-all cursor-default"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner">
                  {c.firstName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-pink-600 transition-colors">
                    {c.prefix}{c.firstName} {c.lastName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StarRating score={c.avgRating} />
                    <span className="text-[10px] font-bold text-slate-900">{c.avgRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200 group-hover:border-pink-100 transition-colors">
                  <MessageSquareQuote className="w-3 h-3 text-slate-400 group-hover:text-pink-500" />
                  <span className="text-[11px] font-bold text-slate-700">{c.feedbackCount.toLocaleString()}</span>
                </div>
                {c.avgRating >= 4.5 && (
                  <div className="text-[9px] font-black uppercase text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-sm">
                    TOP
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DataStoryCard>
  );
}
