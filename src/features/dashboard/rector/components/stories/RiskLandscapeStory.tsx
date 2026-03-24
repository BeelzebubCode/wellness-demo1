// src/features/dashboard/rector/components/stories/RiskLandscapeStory.tsx
"use client";

import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { DataStoryCard } from "../../../widgets/story/DataStoryCard";
import { StoryFilterStack } from "../../../widgets/story/StoryFilterChips";
import { StrategicRiskHeatmap } from "../StrategicRiskHeatmap";
import { ProblemLandscapeChart } from "../../../widgets/charts/ProblemLandscapeChart";
import { useAnalytics } from "../../../widgets/hooks/useAnalytics";
import { DatePresetBar, FacultyChipGroup, getDateParams, type DatePreset, type DateRange } from "./RectorStoryUI";

export function RiskLandscapeStory({ delay = 0 }: { delay?: number }) {
    const [date, setDate] = useState<DatePreset>("month");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [facultyIds, setFacultyIds] = useState<number[]>([]);

    const dateParams = getDateParams(date, customRange);
    const { data, loading } = useAnalytics({
        ...dateParams,
        faculty_ids: facultyIds.length > 0 ? facultyIds : undefined,
    });

    return (
        <DataStoryCard
            icon={<ShieldAlert className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-rose-500 to-orange-600"
            title="Institutional Risk & Holistic Landscape"
            narration="การเฝ้าระวังกลุ่มเสี่ยงและการกระจายตัวของปัญหาในระดับมหภาค"
            delay={delay}
            loading={false}
            className="bg-slate-50/50 border-slate-100"
            filters={
                <StoryFilterStack>
                    <DatePresetBar
                        value={date}
                        onChange={setDate}
                        customRange={customRange}
                        onCustomRangeChange={setCustomRange}
                    />
                    <FacultyChipGroup
                        selectedIds={facultyIds}
                        onChange={setFacultyIds}
                    />
                </StoryFilterStack>
            }
        >
            <div className="grid grid-cols-1 gap-8 mt-4">
                <StrategicRiskHeatmap data={data?.loadIndex ?? []} loading={loading} />
                <ProblemLandscapeChart data={data?.problemCategories ?? []} loading={loading} />
            </div>
        </DataStoryCard>
    );
}
