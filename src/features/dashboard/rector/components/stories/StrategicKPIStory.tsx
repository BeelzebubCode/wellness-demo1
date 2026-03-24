// src/features/dashboard/rector/components/stories/StrategicKPIStory.tsx
"use client";

import React, { useState } from "react";
import { Activity } from "lucide-react";
import { DataStoryCard } from "../../../widgets/story/DataStoryCard";
import { StoryFilterStack } from "../../../widgets/story/StoryFilterChips";
import { StrategicKPICards } from "../StrategicKPICards";
import { useAnalytics } from "../../../widgets/hooks/useAnalytics";
import { DatePresetBar, FacultyChipGroup, getDateParams, type DatePreset, type DateRange } from "./RectorStoryUI";

export function StrategicKPIStory({ delay = 0 }: { delay?: number }) {
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
            icon={<Activity className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-indigo-500 to-violet-600"
            title="Executive Pulse"
            narration="ภาพรวมดัชนีชี้วัดความสำเร็จเชิงยุทธศาสตร์และสุขภาพจิตระดับมหาวิทยาลัย"
            delay={delay}
            loading={false} // Loading handled by internally by StrategicKPICards
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
            <StrategicKPICards
                current={data?.summary}
                previous={data?.previousSummary}
                loading={loading}
            />
        </DataStoryCard>
    );
}
