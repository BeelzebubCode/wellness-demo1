// src/features/dashboard/registry/dashboard-registry.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central registry defining each role's dashboard layout, mode, and sections.
// Similar to `lib/constants/*-nav.ts` — single source of truth per role.
// ─────────────────────────────────────────────────────────────────────────────

export type DashboardMode = 'default' | 'dynamic';

export interface SectionConfig {
    /** Must match a key in WIDGET_CATALOG */
    id: string;
    /** Whether this section is visible by default */
    defaultVisible: boolean;
    /** Display order (ascending) */
    order: number;
    /** Grid span: full = 100%, half = 50%, third = 33% */
    span?: 'full' | 'half' | 'third';
}

export interface DashboardConfig {
    role: string;
    label: string;
    labelTh: string;
    basePath: string;
    /** 'default' = fixed layout from config, 'dynamic' = user can toggle sections */
    mode: DashboardMode;
    defaultDateRange: 'current_month' | 'last_7_days' | 'last_30_days';
    /** Ordered list of section configs — drives the dashboard layout */
    sections: SectionConfig[];
    /** Determines how the analytics service groups data */
    groupLevel: 'faculty' | 'department' | 'university' | 'national';
}

// ─── Role Dashboards ────────────────────────────────────────────────────────

export const DASHBOARD_REGISTRY: Record<string, DashboardConfig> = {

    // ── Ministry (กระทรวง อว.) ────────────────────────────────────────────────
    ministry: {
        role: 'MINISTRY',
        label: 'National Overview',
        labelTh: 'ภาพรวมระดับประเทศ',
        basePath: '/ministry',
        mode: 'default',
        defaultDateRange: 'last_30_days',
        groupLevel: 'national',
        sections: [
            { id: 'ministry-kpi', defaultVisible: true, order: 1, span: 'full' },
            { id: 'risk-distribution', defaultVisible: true, order: 2, span: 'half' },
            { id: 'risky-uni-table', defaultVisible: true, order: 3, span: 'half' },
            { id: 'national-heatmap', defaultVisible: true, order: 4, span: 'full' },
        ],
    },

    // ── Rector (อธิการบดี) ────────────────────────────────────────────────────
    rector: {
        role: 'RECTOR',
        label: 'Executive Suite',
        labelTh: 'ศูนย์บัญชาการสุขภาวะ',
        basePath: '/rector',
        mode: 'default',
        defaultDateRange: 'current_month',
        groupLevel: 'faculty',
        sections: [
            { id: 'strategic-kpi', defaultVisible: true, order: 1, span: 'full' },
            { id: 'comparative-trend', defaultVisible: true, order: 2, span: 'full' },
            { id: 'problem-dna', defaultVisible: true, order: 3, span: 'third' },
            { id: 'therapist-resource', defaultVisible: true, order: 4, span: 'half' },
            { id: 'faculty-volume', defaultVisible: true, order: 5, span: 'half' },
            { id: 'risk-heatmap', defaultVisible: true, order: 6, span: 'full' },
            { id: 'problem-landscape', defaultVisible: true, order: 7, span: 'full' },
        ],
    },

    // ── Dean (คณบดี) ──────────────────────────────────────────────────────────
    dean: {
        role: 'DEAN',
        label: 'Faculty Intelligence',
        labelTh: 'แผงควบคุมคณบดี',
        basePath: '/dean',
        mode: 'default',
        defaultDateRange: 'current_month',
        groupLevel: 'department',
        sections: [
            { id: 'kpi-cards', defaultVisible: true, order: 1, span: 'full' },
            { id: 'problem-landscape', defaultVisible: true, order: 2, span: 'full' },
            { id: 'trend-chart', defaultVisible: true, order: 3, span: 'half' },
            { id: 'risk-distribution', defaultVisible: true, order: 4, span: 'half' },
        ],
    },

    // ── Head Consultant (หัวหน้านักจิตวิทยา) ──────────────────────────────────
    'head-consultant': {
        role: 'HEAD_CONSULTANT',
        label: 'Counseling Center',
        labelTh: 'ศูนย์สุขภาวะทางจิต',
        basePath: '/head-consultant',
        mode: 'default',
        defaultDateRange: 'last_30_days',
        groupLevel: 'department',
        sections: [
            { id: 'hc-stats', defaultVisible: true, order: 1, span: 'full' },
            { id: 'problem-category', defaultVisible: true, order: 2, span: 'half' },
            { id: 'consultant-performance', defaultVisible: true, order: 3, span: 'half' },
            { id: 'top-students', defaultVisible: true, order: 4, span: 'half' },
            { id: 'consultant-ratings', defaultVisible: true, order: 5, span: 'half' },
        ],
    },

    // ── Advisor (อาจารย์ที่ปรึกษา) ────────────────────────────────────────────
    advisor: {
        role: 'ADVISOR',
        label: 'Advisor Portal',
        labelTh: 'แผงควบคุมอาจารย์ที่ปรึกษา',
        basePath: '/advisor',
        mode: 'default',
        defaultDateRange: 'current_month',
        groupLevel: 'department',
        sections: [
            { id: 'kpi-cards', defaultVisible: true, order: 1, span: 'full' },
            { id: 'student-rank', defaultVisible: true, order: 2, span: 'full' },
            { id: 'problem-category', defaultVisible: true, order: 3, span: 'half' },
            { id: 'risk-distribution', defaultVisible: true, order: 4, span: 'half' },
            { id: 'attendance-chart', defaultVisible: true, order: 5, span: 'half' },
            { id: 'trend-chart', defaultVisible: true, order: 6, span: 'half' },
        ],
    },

    // ── Super Admin (ผู้ดูแลระบบ) — DYNAMIC MODE ─────────────────────────────
    'super-admin': {
        role: 'SUPER_ADMIN',
        label: 'System Admin',
        labelTh: 'ผู้ดูแลระบบ',
        basePath: '/super-admin',
        mode: 'dynamic',
        defaultDateRange: 'last_30_days',
        groupLevel: 'national',
        sections: [
            { id: 'kpi-cards', defaultVisible: true, order: 1, span: 'full' },
            { id: 'trend-chart', defaultVisible: true, order: 2, span: 'full' },
            { id: 'risk-distribution', defaultVisible: true, order: 3, span: 'half' },
            { id: 'problem-category', defaultVisible: true, order: 4, span: 'half' },
            { id: 'attendance-chart', defaultVisible: false, order: 5, span: 'half' },
            { id: 'cancellation-summary', defaultVisible: false, order: 6, span: 'half' },
            { id: 'problem-landscape', defaultVisible: false, order: 7, span: 'full' },
            { id: 'load-index', defaultVisible: false, order: 8, span: 'full' },
        ],
    },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getDashboardConfig(role: string): DashboardConfig | undefined {
    return DASHBOARD_REGISTRY[role];
}

export function getVisibleSections(config: DashboardConfig): SectionConfig[] {
    return config.sections
        .filter((s) => s.defaultVisible)
        .sort((a, b) => a.order - b.order);
}
