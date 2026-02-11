"use client";

import { useState, useEffect } from "react";

interface FacultyStats {
    totalStudents: number;
    totalBookings: number;
    facultyName: string;
    facultyCode: string;
    universityName: string;
    academicYear: string;
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
    yearLevelDistribution: {
        YEAR_1: number;
        YEAR_2: number;
        YEAR_3: number;
        YEAR_4: number;
        YEAR_5_PLUS: number;
        UNKNOWN: number;
    };
    problemStats: Record<string, number>;
    genderProblemStats: Record<string, Record<string, number>>;
    visitsByMonth: Record<string, number>;
    repeatStats: {
        single: number;
        repeat: number;
    };
    consultantStats: Array<{
        id: number;
        name: string;
        count: number;
    }>;
    activeCases: number;
    visitTrend: string;
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

export function useFacultyStats(facultyCode?: string, dateRange?: { from: Date; to: Date }) {
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
                const params = new URLSearchParams();
                if (facultyCode) params.append("facultyCode", facultyCode);

                if (dateRange?.from && dateRange?.to) {
                    // Format as YYYY-MM-DD
                    const startDate = dateRange.from.toISOString().split('T')[0];
                    const endDate = dateRange.to.toISOString().split('T')[0];
                    params.append("startDate", startDate);
                    params.append("endDate", endDate);
                    console.log('[useFacultyStats] Date range:', startDate, 'to', endDate);
                }

                const url = `/api/v2/dean/dashboard?${params.toString()}`;
                console.log('[useFacultyStats] Fetching URL:', url);

                let response = await fetch(url);

                // If Forbidden (403), it might be a Rector trying to view a faculty.
                // Try the Rector-specific endpoint instead.
                if (response.status === 403) {
                    const rectorUrl = `/api/v2/rector/dashboard?${params.toString()}`;

                    console.log("Dean access forbidden, trying Rector access:", rectorUrl);
                    response = await fetch(rectorUrl);
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Failed to fetch faculty stats");
                }

                if (result.success) {
                    const data = result.data;

                    console.log('[useFacultyStats] Received problemStats:', data.problemStats);

                    setStats({
                        totalStudents: data.totalStudents,
                        totalBookings: data.totalBookings,
                        totalDepartments: data.totalDepartments,
                        facultyName: data.facultyName,
                        facultyCode: data.facultyCode,
                        universityName: data.universityName,
                        academicYear: data.academicYear || '',
                        educationFieldGroup: data.educationFieldGroup,
                        departmentStats: data.departmentStats,
                        riskDistribution: data.riskDistribution,
                        yearLevelDistribution: data.yearLevelDistribution,
                        problemStats: data.problemStats,
                        genderProblemStats: data.genderProblemStats,
                        visitsByMonth: data.visitsByMonth,
                        repeatStats: data.repeatStats,
                        consultantStats: data.consultantStats,
                        activeCases: data.activeCases,
                        visitTrend: data.visitTrend,
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
    }, [facultyCode, filters, dateRange]);

    return { stats, analytics, students, riskTrends, isLoading, filters, setFilters, error };
}
