"use client";

import { DeanDashboard } from "@/features/dashboard/dean/components/DeanDashboard";

interface Props {
    facultyCode: string;
}

/**
 * Rector's view of a specific faculty dashboard.
 * This reuses the DeanDashboard component which provides
 * all analytics scoped to a specific faculty within their university.
 * 
 * Data shown:
 * - Student lists (anonymized overview)
 * - Problem types by faculty
 * - Gender vs problem breakdown
 * - Time analysis (weekly/monthly/yearly for consultation trends)
 * - Repeat consultations
 * - Risk distribution (high/medium/low)
 */
export function RectorFacultyDetailDashboard({ facultyCode }: Props) {
    // Pass the facultyCode to DeanDashboard which will fetch faculty-specific data
    return <DeanDashboard facultyCode={facultyCode} />;
}
