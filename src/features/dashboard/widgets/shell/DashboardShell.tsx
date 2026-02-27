// src/features/dashboard/widgets/shell/DashboardShell.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Main orchestrator component — renders any role's dashboard from config.
// Supports both Default (fixed layout) and Dynamic (user-toggleable) modes.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from 'react';
import { getDashboardConfig } from '../../registry/dashboard-registry';
import { WIDGET_CATALOG } from '../../registry/widget-catalog';
import { useAnalytics } from '../hooks/useAnalytics';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { DashboardFilterBar } from '../filters/DashboardFilterBar';
import { DashboardGrid, GridCell } from './DashboardGrid';
import { WidgetTogglePanel } from './WidgetTogglePanel';

interface DashboardShellProps {
    /** Role key matching DASHBOARD_REGISTRY (e.g. 'rector', 'ministry') */
    role: string;
    /** Optional: children to render after the auto-generated sections */
    children?: React.ReactNode;
    /** Optional: override initial analytics params */
    initialParams?: Record<string, any>;
}

export function DashboardShell({ role, children, initialParams }: DashboardShellProps) {
    const config = getDashboardConfig(role);

    if (!config) {
        return (
            <div className="text-center py-20 text-slate-500">
                <p className="text-lg font-bold">Dashboard config not found for role: {role}</p>
            </div>
        );
    }

    const { data, loading, params, setParams } = useAnalytics(initialParams);
    const { visibleSections, visibilityMap, toggleSection, resetToDefaults, isDynamic } =
        useDashboardLayout(config);

    return (
        <div className="space-y-6">
            {/* Filter Bar — driven by filter-config.ts */}
            <section className="relative z-40">
                <DashboardFilterBar role={role} params={params} onChange={setParams} />
            </section>

            {/* Dynamic mode: toggle panel */}
            {isDynamic && (
                <WidgetTogglePanel
                    sections={config.sections}
                    visibilityMap={visibilityMap}
                    onToggle={toggleSection}
                    onReset={resetToDefaults}
                />
            )}

            {/* Render visible sections */}
            <DashboardGrid>
                {visibleSections.map((section) => {
                    const widget = WIDGET_CATALOG[section.id];
                    if (!widget) return null;

                    const Widget = widget.component;

                    // Build props from data keys
                    const widgetProps: Record<string, any> = { loading };
                    for (const key of widget.dataKeys) {
                        widgetProps[key === 'summary' ? 'data' : key] = (data as any)?.[key] ?? null;
                    }

                    // Special handling for specific widgets
                    if (section.id === 'kpi-cards' || section.id === 'ministry-kpi') {
                        widgetProps.data = data?.summary ?? null;
                    }
                    if (section.id === 'strategic-kpi') {
                        widgetProps.current = data?.summary ?? null;
                        widgetProps.previous = data?.previousSummary ?? null;
                    }
                    if (section.id === 'trend-chart') {
                        widgetProps.data = data?.trend ?? [];
                    }
                    if (section.id === 'comparative-trend') {
                        widgetProps.data = data?.trend ?? [];
                        widgetProps.resolution = data?.trendResolution;
                    }
                    if (section.id === 'risk-distribution') {
                        widgetProps.data = data?.riskDistribution ?? null;
                    }
                    if (section.id === 'problem-category' || section.id === 'problem-dna' || section.id === 'problem-landscape') {
                        widgetProps.data = data?.problemCategories ?? [];
                    }
                    if (section.id === 'attendance-chart') {
                        widgetProps.data = data?.attendanceByGroup ?? [];
                    }
                    if (section.id === 'cancellation-summary') {
                        widgetProps.data = data?.cancellationByGroup ?? [];
                    }
                    if (section.id === 'load-index' || section.id === 'faculty-volume' || section.id === 'risk-heatmap') {
                        widgetProps.data = data?.loadIndex ?? [];
                    }
                    if (section.id === 'student-rank') {
                        widgetProps.data = data?.studentRank ?? [];
                    }
                    if (section.id === 'therapist-resource') {
                        widgetProps.data = data?.therapistResource;
                    }

                    return (
                        <GridCell key={section.id} span={section.span}>
                            <Widget {...widgetProps} />
                        </GridCell>
                    );
                })}
            </DashboardGrid>

            {/* Optional custom sections from the role dashboard */}
            {children}
        </div>
    );
}
