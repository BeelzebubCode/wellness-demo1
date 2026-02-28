// src/features/dashboard/widgets/story/DataStoryGrid.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Responsive grid layout for DataStory cards
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";

interface Props {
    children: React.ReactNode;
    /** Number of columns at lg breakpoint. Default = 2 */
    cols?: 1 | 2 | 3;
}

const colsMap = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
} as const;

export function DataStoryGrid({ children, cols = 2 }: Props) {
    return (
        <div className={`grid grid-cols-1 ${colsMap[cols]} gap-5`}>
            {children}
        </div>
    );
}
