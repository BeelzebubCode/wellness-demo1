"use client";

import { DeanDashboard } from "@/features/dashboard/dean/components/DeanDashboard";

interface Props {
    facultyCode: string;
}

/**
 * Rector's view of a specific faculty dashboard.
 * This reuses the Dean Dashboard component which  provides
 * all analytics scoped to a specific faculty within their university.
 */
export function RectorFacultyDetailDashboard({ facultyCode }: Props) {
    // The DeanDashboard component will fetch data based on the logged-in user's context
    // For Rector viewing a faculty, they will see the same analytics that the Dean would see
    return <DeanDashboard />;
}
