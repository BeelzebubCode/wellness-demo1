// src/features/dashboard/registry/widget-catalog.ts
// ─────────────────────────────────────────────────────────────────────────────
// Widget catalog — maps section IDs to lazy-loaded components + metadata.
// Used by DashboardShell to dynamically render the correct widget per section.
// ─────────────────────────────────────────────────────────────────────────────

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// ─── Skeleton Loaders ───────────────────────────────────────────────────────

const SkeletonFull = () => <div className="h-32 bg-slate-50 animate-pulse rounded-3xl" />;
const SkeletonChart = () => <div className="h-96 bg-slate-50 animate-pulse rounded-3xl" />;
const SkeletonTall = () => <div className="h-[600px] bg-slate-50 animate-pulse rounded-3xl" />;

// ─── Types ──────────────────────────────────────────────────────────────────

export type WidgetCategory = 'kpi' | 'chart' | 'table' | 'map';

export interface WidgetMeta {
    /** Must match SectionConfig.id in dashboard-registry */
    id: string;
    /** Display name (English) */
    label: string;
    /** Display name (Thai) */
    labelTh: string;
    /** Category for grouping in dynamic mode toggle panel */
    category: WidgetCategory;
    /** Lazy-loaded React component */
    component: ComponentType<any>;
    /**
     * Key(s) in AnalyticsResult that this widget needs.
     * Used by DashboardShell to pass the correct data slice.
     */
    dataKeys: string[];
}

// ─── Shared Widgets (from widgets/) ────────────────────────────────────────

const SHARED_WIDGETS: Record<string, WidgetMeta> = {
    'kpi-cards': {
        id: 'kpi-cards',
        label: 'KPI Summary Cards',
        labelTh: 'บัตร KPI สรุปผล',
        category: 'kpi',
        component: dynamic(
            () => import('../widgets/cards/SummaryKPICards').then(m => ({ default: m.SummaryKPICards })),
            { loading: SkeletonFull, ssr: false },
        ),
        dataKeys: ['summary'],
    },

    'trend-chart': {
        id: 'trend-chart',
        label: 'Trend Analysis',
        labelTh: 'แนวโน้มตามเวลา',
        category: 'chart',
        component: dynamic(
            () => import('../widgets/charts/TrendChart').then(m => ({ default: m.TrendChart })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['trend'],
    },

    'risk-distribution': {
        id: 'risk-distribution',
        label: 'Risk Distribution',
        labelTh: 'การกระจายความเสี่ยง',
        category: 'chart',
        component: dynamic(
            () => import('../widgets/charts/RiskDistributionChart').then(m => ({ default: m.RiskDistributionChart })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['riskDistribution'],
    },

    'problem-category': {
        id: 'problem-category',
        label: 'Problem Categories',
        labelTh: 'หมวดหมู่ปัญหา',
        category: 'chart',
        component: dynamic(
            () => import('../widgets/charts/ProblemCategoryChart').then(m => ({ default: m.ProblemCategoryChart })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['problemCategories'],
    },

    'attendance-chart': {
        id: 'attendance-chart',
        label: 'Attendance Analysis',
        labelTh: 'สถิติการเข้าพบ',
        category: 'chart',
        component: dynamic(
            () => import('../widgets/charts/AttendanceChart').then(m => ({ default: m.AttendanceChart })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['attendanceByGroup'],
    },

    'cancellation-summary': {
        id: 'cancellation-summary',
        label: 'Cancellation Summary',
        labelTh: 'สรุปการยกเลิก',
        category: 'chart',
        component: dynamic(
            () => import('../widgets/charts/CancellationSummary').then(m => ({ default: m.CancellationSummary })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['cancellationByGroup'],
    },

    'problem-landscape': {
        id: 'problem-landscape',
        label: 'Problem Landscape',
        labelTh: 'ภูมิทัศน์ปัญหา',
        category: 'chart',
        component: dynamic(
            () => import('../widgets/charts/ProblemLandscapeChart').then(m => ({ default: m.ProblemLandscapeChart })),
            { loading: SkeletonTall, ssr: false },
        ),
        dataKeys: ['problemCategories'],
    },

    'load-index': {
        id: 'load-index',
        label: 'Load/Stress Index',
        labelTh: 'ดัชนีภาระงาน',
        category: 'chart',
        component: dynamic(
            () => import('../widgets/charts/LoadIndexChart').then(m => ({ default: m.LoadIndexChart })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['loadIndex'],
    },

    'student-rank': {
        id: 'student-rank',
        label: 'Student Risk Ranking',
        labelTh: 'จัดอันดับนิสิตตามความเสี่ยง',
        category: 'table',
        component: dynamic(
            () => import('../widgets/charts/StudentRankTable').then(m => ({ default: m.StudentRankTable })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['studentRank'],
    },
};

// ─── Role-Specific Widgets ──────────────────────────────────────────────────

const ROLE_WIDGETS: Record<string, WidgetMeta> = {

    // ── Rector ────────────────────────────────────────────────────────────────
    'strategic-kpi': {
        id: 'strategic-kpi',
        label: 'Strategic KPI Cards',
        labelTh: 'บัตร KPI เชิงกลยุทธ์',
        category: 'kpi',
        component: dynamic(
            () => import('../rector/components/StrategicKPICards').then(m => ({ default: m.StrategicKPICards })),
            { loading: SkeletonFull, ssr: false },
        ),
        dataKeys: ['summary', 'previousSummary'],
    },

    'comparative-trend': {
        id: 'comparative-trend',
        label: 'Comparative Trend',
        labelTh: 'แนวโน้มเชิงเปรียบเทียบ',
        category: 'chart',
        component: dynamic(
            () => import('../rector/components/ComparativeTrendChart').then(m => ({ default: m.ComparativeTrendChart })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['trend', 'trendResolution'],
    },

    'problem-dna': {
        id: 'problem-dna',
        label: 'Problem DNA',
        labelTh: 'DNA ปัญหา',
        category: 'chart',
        component: dynamic(
            () => import('../rector/components/ProblemDNAChart').then(m => ({ default: m.ProblemDNAChart })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['problemCategories'],
    },

    'therapist-resource': {
        id: 'therapist-resource',
        label: 'Therapist Resources',
        labelTh: 'ทรัพยากรนักจิตวิทยา',
        category: 'chart',
        component: dynamic(
            () => import('../rector/components/TherapistResourceChart').then(m => ({ default: m.TherapistResourceChart })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['therapistResource'],
    },

    'faculty-volume': {
        id: 'faculty-volume',
        label: 'Faculty Volume',
        labelTh: 'ปริมาณจัดการรายคณะ',
        category: 'chart',
        component: dynamic(
            () => import('../rector/components/FacultyVolumeChart').then(m => ({ default: m.FacultyVolumeChart })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['loadIndex'],
    },

    'risk-heatmap': {
        id: 'risk-heatmap',
        label: 'Strategic Risk Heatmap',
        labelTh: 'แผนที่ความร้อนความเสี่ยง',
        category: 'chart',
        component: dynamic(
            () => import('../rector/components/StrategicRiskHeatmap').then(m => ({ default: m.StrategicRiskHeatmap })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['loadIndex'],
    },

    // ── Ministry ──────────────────────────────────────────────────────────────
    'ministry-kpi': {
        id: 'ministry-kpi',
        label: 'Ministry Stats',
        labelTh: 'สถิติระดับกระทรวง',
        category: 'kpi',
        component: dynamic(
            () => import('../ministry/components/MinistryStatsCards').then(m => ({ default: m.MinistryStatsCards })),
            { loading: SkeletonFull, ssr: false },
        ),
        dataKeys: ['stats'],
    },

    'risky-uni-table': {
        id: 'risky-uni-table',
        label: 'Risky Universities',
        labelTh: 'มหาวิทยาลัยกลุ่มเสี่ยง',
        category: 'table',
        component: dynamic(
            () => import('../ministry/components/RiskyUniversityTable').then(m => ({ default: m.RiskyUniversityTable })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['riskyUnis'],
    },

    'national-heatmap': {
        id: 'national-heatmap',
        label: 'National Heatmap',
        labelTh: 'แผนที่ความร้อนระดับประเทศ',
        category: 'map',
        component: dynamic(
            () => import('../ministry/components/HeatMapDashboard').then(m => ({ default: m.HeatMapDashboard })),
            { loading: SkeletonTall, ssr: false },
        ),
        dataKeys: [],
    },

    // ── Head Consultant ───────────────────────────────────────────────────────
    'hc-stats': {
        id: 'hc-stats',
        label: 'Head Consultant Stats',
        labelTh: 'สถิติหัวหน้านักจิตวิทยา',
        category: 'kpi',
        component: dynamic(
            () => import('../head-consultant/components/HeadConsultantStats').then(m => ({ default: m.HeadConsultantStats })),
            { loading: SkeletonFull, ssr: false },
        ),
        dataKeys: ['stats'],
    },

    'consultant-performance': {
        id: 'consultant-performance',
        label: 'Consultant Performance',
        labelTh: 'ผลงานนักจิตวิทยา',
        category: 'chart',
        component: dynamic(
            () => import('../head-consultant/components/ConsultantPerformanceChart').then(m => ({ default: m.ConsultantPerformanceChart })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['team'],
    },

    'top-students': {
        id: 'top-students',
        label: 'Top Risk Students',
        labelTh: 'นิสิตเสี่ยงสูง',
        category: 'table',
        component: dynamic(
            () => import('../head-consultant/components/TopStudentsCard').then(m => ({ default: m.TopStudentsCard })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['topStudents'],
    },

    'consultant-ratings': {
        id: 'consultant-ratings',
        label: 'Consultant Ratings',
        labelTh: 'คะแนนนักจิตวิทยา',
        category: 'table',
        component: dynamic(
            () => import('../head-consultant/components/ConsultantRatingTable').then(m => ({ default: m.ConsultantRatingTable })),
            { loading: SkeletonChart, ssr: false },
        ),
        dataKeys: ['ratings'],
    },
};

// ─── Combined Catalog ───────────────────────────────────────────────────────

export const WIDGET_CATALOG: Record<string, WidgetMeta> = {
    ...SHARED_WIDGETS,
    ...ROLE_WIDGETS,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getWidget(id: string): WidgetMeta | undefined {
    return WIDGET_CATALOG[id];
}

export function getWidgetsByCategory(category: WidgetCategory): WidgetMeta[] {
    return Object.values(WIDGET_CATALOG).filter((w) => w.category === category);
}
