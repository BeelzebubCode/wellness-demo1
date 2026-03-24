"use client";

import { DeanDashboard } from "@/features/dashboard/dean/components/DeanDashboard";

interface Props {
    facultyCode?: string;
}

/**
 * Rector's view of a specific faculty dashboard.
 * Reuses DeanDashboard which fetches its own faculty data.
 * facultyCode is accepted for route compatibility but DeanDashboard
 * determines faculty from the logged-in user's context.
 */
export function RectorFacultyDetailDashboard({ facultyCode: _facultyCode }: Props) {
    return <DeanDashboard />;
}
