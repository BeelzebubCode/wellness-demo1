// src/features/dashboard/widgets/shell/DashboardGrid.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Responsive grid that renders sections according to their span config.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from 'react';
import type { SectionConfig } from '../../registry/dashboard-registry';

const SPAN_CLASSES: Record<string, string> = {
    full: 'col-span-12',
    half: 'col-span-12 lg:col-span-6',
    third: 'col-span-12 lg:col-span-4',
};

interface GridCellProps {
    span?: SectionConfig['span'];
    children: React.ReactNode;
}

export function GridCell({ span = 'full', children }: GridCellProps) {
    return (
        <div className={SPAN_CLASSES[span] ?? SPAN_CLASSES.full}>
            {children}
        </div>
    );
}

export function DashboardGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
            {children}
        </div>
    );
}
