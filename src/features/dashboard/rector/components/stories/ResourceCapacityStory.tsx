// src/features/dashboard/rector/components/stories/ResourceCapacityStory.tsx
"use client";

import React, { useState } from "react";
import { Users } from "lucide-react";
import { DataStoryCard } from "../../../widgets/story/DataStoryCard";
import { StoryFilterStack } from "../../../widgets/story/StoryFilterChips";
import { TherapistResourceChart } from "../TherapistResourceChart";
import { FacultyVolumeChart } from "../FacultyVolumeChart";
import { useAnalytics } from "../../../widgets/hooks/useAnalytics";
import { DatePresetBar, FacultyChipGroup, getDateParams, type DatePreset, type DateRange } from "./RectorStoryUI";

export function ResourceCapacityStory({ delay = 0, onFacultyClick }: { delay?: number; onFacultyClick?: (id: number) => void }) {
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
            icon={<Users className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            title="Resource Capacity & Sustainability"
            narration="การบริหารจัดการบุคลากรและศักยภาพการรองรับนิสิตแยกตามคณะ"
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
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
                <div className="lg:col-span-2">
                    <TherapistResourceChart data={data?.therapistResource} />
                </div>
                <div className="lg:col-span-3">
                    <FacultyVolumeChart
                        data={data?.loadIndex ?? []}
                        loading={loading}
                        onBarClick={(item) => onFacultyClick?.(item.groupId)}
                    />
                </div>
            </div>
        </DataStoryCard>
    );
}
