"use client";

import { RectorFacultyDetailDashboard } from "@/features/dashboard/rector/components/RectorFacultyDetailDashboard";

interface Props {
    params: {
        code: string;
    };
}

export default function RectorFacultyDetailPage({ params }: Props) {
    return <RectorFacultyDetailDashboard facultyCode={params.code} />;
}
