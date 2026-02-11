"use client";

import { DateCalendarPopover } from "../filters/inputs/DateCalendarPopover";
import { ArrowRight } from "lucide-react";
import { toYMD, fromYMD } from "@/lib/date";

interface DateRangePickerProps {
    startDate?: Date;
    endDate?: Date;
    onChange: (range: { from?: Date; to?: Date }) => void;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
    const startYMD = startDate ? toYMD(startDate) : undefined;
    const endYMD = endDate ? toYMD(endDate) : undefined;

    const handleStartChange = (ymd: string) => {
        const date = ymd ? fromYMD(ymd) : undefined;
        onChange({ from: date, to: endDate });
    };

    const handleEndChange = (ymd: string) => {
        const date = ymd ? fromYMD(ymd) : undefined;
        onChange({ from: startDate, to: date });
    };

    return (
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <DateCalendarPopover
                valueYMD={startYMD}
                onChangeYMD={handleStartChange}
                maxDate={endDate}
                placeholder="วันเริ่มต้น"
                align="right"
            />
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <DateCalendarPopover
                valueYMD={endYMD}
                onChangeYMD={handleEndChange}
                minDate={startDate}
                placeholder="วันสิ้นสุด"
                align="right"
            />
        </div>
    );
}
