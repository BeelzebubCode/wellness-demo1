"use client";

import { useState, useEffect } from "react";

interface FacultyStats {
    totalStudents: number;
    totalBookings: number;
    facultyName: string;
    facultyCode: string;
    universityName: string;
    totalDepartments: number;
    educationFieldGroup: string | null;
    departmentStats: Array<{
        departmentId: number;
        departmentCode: string;
        departmentName: string;
        studentCount: number;
        bookingCount: number;
    }>;
    riskDistribution: {
        HIGH: number;
        MEDIUM: number;
        LOW: number;
        NORMAL: number;
    };
    problemStats: Record<string, number>;
    genderProblemStats: Record<string, Record<string, number>>;
    visitsByMonth: Record<string, number>;
    repeatStats: {
        single: number;
        repeat: number;
    };
}

interface StudentListItem {
    id: number;
    code: string | null;
    name: string;
    department: string | undefined;
    latestRisk: number;
    lastActivity: Date | null;
}

interface RiskTrendItem {
    month: string;
    averageRisk: number;
}

export function useFacultyStats(facultyCode?: string) {
    const [stats, setStats] = useState<FacultyStats | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [students, setStudents] = useState<StudentListItem[]>([]);
    const [riskTrends, setRiskTrends] = useState<RiskTrendItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<any>({ riskLevel: "ALL" });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const url = facultyCode
                    ? `/api/v2/dean/dashboard?facultyCode=${encodeURIComponent(facultyCode)}`
                    : "/api/v2/dean/dashboard";

                let response = await fetch(url);
                
                // If Forbidden (403), it might be a Rector trying to view a faculty.
                // Try the Rector-specific endpoint instead.
                if (response.status === 403) {
                    const rectorUrl = facultyCode
                        ? `/api/v2/rector/dashboard?facultyCode=${encodeURIComponent(facultyCode)}`
                        : "/api/v2/rector/dashboard";
                    
                    console.log("Dean access forbidden, trying Rector access:", rectorUrl);
                    response = await fetch(rectorUrl);
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Failed to fetch faculty stats");
                }

                if (result.success) {
                    const data = result.data;

                    setStats({
                        totalStudents: data.totalStudents,
                        totalBookings: data.totalBookings,
                        totalDepartments: data.totalDepartments,
                        facultyName: data.facultyName,
                        facultyCode: data.facultyCode,
                        universityName: data.universityName,
                        educationFieldGroup: data.educationFieldGroup,
                        departmentStats: data.departmentStats,
                        riskDistribution: data.riskDistribution,
                        problemStats: data.problemStats,
                        genderProblemStats: data.genderProblemStats,
                        visitsByMonth: data.visitsByMonth,
                        repeatStats: data.repeatStats,
                    });

                    setAnalytics({
                        problemStats: data.problemStats,
                        genderProblemStats: data.genderProblemStats,
                        visitsByMonth: data.visitsByMonth,
                        repeatStats: data.repeatStats,
                        riskDistribution: data.riskDistribution,
                    });

                    // Mock student data for now - will be replaced with actual API call
                    setStudents(data.students || []);

                    // Mock risk trends for now - will be replaced with actual calculation
                    setRiskTrends(data.riskTrends || []);
                } else {
                    throw new Error(result.error || "Unknown error");
                }
            } catch (err: any) {
                console.error("Error fetching faculty stats:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [facultyCode, filters]);

    return { stats, analytics, students, riskTrends, isLoading, filters, setFilters, error };
}
