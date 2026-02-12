"use client";

import { FacultyDetailDashboard } from "@/features/dashboard/dean/components/FacultyDetailDashboard";
import { Department_MED } from "@/features/university-management/cu/med/department_MED";

interface Props {
    params: {
        code: string;
    };
}

export default function FacultyDetailPage({ params }: Props) {
    const isMed = params.code?.toUpperCase() === "MED";

    if (isMed) {
        return <Department_MED />;
    }

    return <FacultyDetailDashboard facultyCode={params.code} />;
}
