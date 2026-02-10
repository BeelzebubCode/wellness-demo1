"use client";

import { FacultyDetailDashboard } from "@/features/dashboard/dean/components/FacultyDetailDashboard";

interface Props {
    params: {
        code: string;
    };
}

export default function FacultyDetailPage({ params }: Props) {
    return <FacultyDetailDashboard facultyCode={params.code} />;
}
