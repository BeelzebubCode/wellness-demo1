// src/features/dashboard/rector/components/stories/StrategicDemandStory.tsx
"use client";

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import { DataStoryCard } from "../../../widgets/story/DataStoryCard";
import { StoryFilterStack } from "../../../widgets/story/StoryFilterChips";
import { ComparativeTrendChart } from "../ComparativeTrendChart";
import { ProblemDNAChart } from "../ProblemDNAChart";
import { useAnalytics } from "../../../widgets/hooks/useAnalytics";
import { DatePresetBar, FacultyChipGroup, getDateParams, type DatePreset, type DateRange } from "./RectorStoryUI";

export function StrategicDemandStory({ delay = 0 }: { delay?: number }) {
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
            icon={<TrendingUp className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            title="Strategic Demand Dynamics"
            narration="วิเคราะห์แนวโน้มความต้องการและสัดส่วนประเภทปัญหาเชิงนโยบาย"
            delay={delay}
            loading={false}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                <div className="lg:col-span-2">
                    <ComparativeTrendChart
                        data={data?.trend ?? []}
                        resolution={data?.trendResolution}
                        loading={loading}
                    />
                </div>
                <div>
                    <ProblemDNAChart data={data?.problemCategories ?? []} loading={loading} />
                </div>
            </div>
        </DataStoryCard>
    );
}
