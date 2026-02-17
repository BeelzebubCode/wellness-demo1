"use client";

import React, { useState, useEffect } from "react";
import { useDeanFacultyData } from "@/features/dashboard/dean/hooks/useDeanFacultyData";
import { FacultyFilterView } from "@/features/dashboard/dean/components/FacultyFilterView";
import { LoadingSpinner } from "@/components/ui";

export default function FilterPage() {
    const [facultyCode, setFacultyCode] = useState<string | null>(null);
    const { data, loading, error } = useDeanFacultyData(facultyCode || undefined);

    useEffect(() => {
        try {
            const authUserStr = localStorage.getItem("auth_user");
            if (authUserStr) {
                const authUser = JSON.parse(authUserStr);
                const username = authUser.name || "";
                if (username.startsWith("dean_")) {
                    const parts = username.split("_");
                    if (parts.length >= 3) {
                        let code = parts[2].toUpperCase();
                        if (code === "AGR") code = "AGRI";
                        setFacultyCode(code);
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing auth_user", e);
        }
    }, []);

    if (loading && !data) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error && !data) {
        return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-slate-500">No data found</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-12 pb-32">
             <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">ตัวกรอง</h1>
                <p className="text-slate-500">ค้นหาและกรองข้อมูลเคส</p>
            </div>
            <FacultyFilterView cases={data.recentCases} />
        </div>
    );
}
