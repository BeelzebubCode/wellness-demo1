"use client";

import { DeanDashboard } from "@/features/dashboard/dean/components/DeanDashboard";

interface Props {
    facultyCode: string;
}

/**
 * Rector's view of a specific faculty dashboard.
 * Reuses DeanDashboard with the faculty code to scope data
 * to the selected faculty.
 */
export function RectorFacultyDetailDashboard({ facultyCode }: Props) {
    return <DeanDashboard facultyCode={facultyCode} />;
}
