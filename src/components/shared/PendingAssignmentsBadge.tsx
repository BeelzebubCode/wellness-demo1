"use client";

import React from "react";
import { usePendingAssignmentsCount } from "@/features/head-consultant/bookings/hook/usePendingAssignmentsCount";
import { cn } from "@/lib/cn";

interface PendingAssignmentsBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    maxCount?: number;
}

export function PendingAssignmentsBadge({
    className,
    maxCount = 99,
    ...props
}: PendingAssignmentsBadgeProps) {
    const { data: count = 0, isLoading } = usePendingAssignmentsCount();

    if (isLoading || count === 0) return null;

    return (
        <span
            className={cn(
                "bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0 animate-in fade-in zoom-in duration-300",
                className
            )}
            {...props}
        >
            {count > maxCount ? `${maxCount}+` : count}
        </span>
    );
}
