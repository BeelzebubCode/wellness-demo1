"use client";

import React, { useState, useEffect } from "react";
import { useDeanFacultyData } from "@/features/dashboard/dean/hooks/useDeanFacultyData";
import { DepartmentListing, DepartmentStat } from "@/features/dashboard/dean/components/DepartmentListing";
import { UnifiedDepartmentDashboard } from "@/features/dashboard/dean/components/UnifiedDepartmentDashboard";
import { LoadingSpinner } from "@/components/ui";

export default function SubjectGroupPage() {
    const [facultyCode, setFacultyCode] = useState<string | null>(null);
    const { data, loading, error } = useDeanFacultyData(facultyCode || undefined);
    const [activeDepartment, setActiveDepartment] = useState<DepartmentStat | null>(null);

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

    if (activeDepartment) {
        return (
            <UnifiedDepartmentDashboard
                department={activeDepartment}
                facultyName={data.facultyName}
                universityName={data.universityName}
                onBack={() => setActiveDepartment(null)}
                onBackToList={() => setActiveDepartment(null)}
            />
        );
    }

    // Map Departments
    const departments: DepartmentStat[] = data.departmentStats.map((d) => ({
        id: d.departmentId.toString(),
        code: `${data.facultyCode}-${d.departmentCode}`,
        name: d.departmentName,
        students: d.studentCount,
        sessions: d.bookingCount,
        perStudent: d.bookingCount / (d.studentCount || 1),
        riskData: [
            { name: "วิกฤต (Critical)", value: d.riskDistribution.HIGH, color: "#ef4444" },
            { name: "ปกติ (Normal)", value: d.studentCount - d.riskDistribution.HIGH, color: "#10b981" },
        ],
        trendData: Object.entries(d.visitsByMonth || {}).map(([month, count]) => ({
            month: month.split("-")[1] + "/" + month.split("-")[0].slice(2),
            sessions: count as number,
        })),
        topProblems: Object.entries(d.genderProblemStats || {}).reduce((acc: any[], [gender, categories]) => {
            Object.entries(categories as Record<string, number>).forEach(([name, count]) => {
                const existing = acc.find((p: any) => p.name === name);
                const c = count as number;
                if (existing) {
                    if (gender === "Male") existing.male = c;
                    else if (gender === "Female") existing.female = c;
                    else existing.other = c;
                    existing.total = existing.male + existing.female + existing.other;
                } else {
                    acc.push({
                        name,
                        male: gender === "Male" ? c : 0,
                        female: gender === "Female" ? c : 0,
                        other: gender === "Other" ? c : 0,
                        total: c
                    });
                }
            });
            return acc;
        }, []).sort((a: any, b: any) => b.total - a.total).slice(0, 5)
    }));

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-12 pb-32">
             <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">ภาควิชา</h1>
                <p className="text-slate-500">ข้อมูลสถิติแยกตามภาควิชา</p>
            </div>
            <DepartmentListing
                departments={departments}
                onSelect={setActiveDepartment}
            />
        </div>
    );
}
