"use client";

import { useState, useEffect } from "react";

interface UniversityStats {
    totalStudents: number;
    totalBookings: number;
    universityId: number;
    universityName: string;
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
    facultyBreakdown: Array<{
        facultyName: string;
        studentCount: number;
        bookingCount: number;
        highRiskCount: number;
        mediumRiskCount: number;
        lowRiskCount: number;
    }>;
    riskTrends: Array<{
        month: string;
        averageRisk: number;
    }>;
    activeCases: number;
    visitTrend: string;
    wellbeing?: {
        overallScore: number;
        riskScore: number;
        satisfactionScore: number;
        engagementScore: number;
        highRiskRate: number;
        activeStudents: number;
    };
    healthMap?: Array<{
        id: number;
        name: string;
        engagementRate: number;
        riskIndex: number;
        studentCount: number;
        highRiskCount: number;
    }>;
}

import { RectorDashboardFilters } from "../types";

export function useUniversityStats(filters: RectorDashboardFilters = {}) {
    const [stats, setStats] = useState<UniversityStats | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [facultyBreakdown, setFacultyBreakdown] = useState<any[]>([]);
    const [riskTrends, setRiskTrends] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                // Build query string with filter parameters
                const params = new URLSearchParams();
                if (filters.startDate) params.append("startDate", filters.startDate.toISOString());
                if (filters.endDate) params.append("endDate", filters.endDate.toISOString());
                if (filters.facultyId) params.append("facultyId", filters.facultyId.toString());
                if (filters.departmentId) params.append("departmentId", filters.departmentId.toString());
                if (filters.problemCategoryId) params.append("problemCategoryId", filters.problemCategoryId.toString());
                if (filters.gender) params.append("gender", filters.gender);

                const queryString = params.toString();
                const url = `/api/v2/rector/university-stats${queryString ? `?${queryString}` : ''}`;

                const response = await fetch(url);
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Failed to fetch university stats");
                }

                if (result.success) {
                    const data = result.data;

                    setStats({
                        totalStudents: data.totalStudents,
                        totalBookings: data.totalBookings,
                        universityId: data.universityId,
                        universityName: data.universityName,
                        riskDistribution: data.riskDistribution,
                        yearLevelDistribution: data.yearLevelDistribution,
                        problemStats: data.problemStats,
                        genderProblemStats: data.genderProblemStats,
                        visitsByMonth: data.visitsByMonth,
                        repeatStats: data.repeatStats,
                        facultyBreakdown: data.facultyBreakdown || [],
                        riskTrends: data.riskTrends || [],
                        activeCases: data.activeCases || 0,
                        visitTrend: data.visitTrend || "0",
                        wellbeing: data.wellbeing,
                        healthMap: data.healthMap,
                    });

                    setAnalytics({
                        problemStats: data.problemStats,
                        genderProblemStats: data.genderProblemStats,
                        yearLevelDistribution: data.yearLevelDistribution,
                        visitsByMonth: data.visitsByMonth,
                        repeatStats: data.repeatStats,
                        riskDistribution: data.riskDistribution,
                        wellbeing: data.wellbeing,
                        healthMap: data.healthMap,
                    });

                    setFacultyBreakdown(data.facultyBreakdown || []);
                    setRiskTrends(data.riskTrends || []);
                } else {
                    throw new Error(result.error || "Unknown error");
                }
            } catch (err: any) {
                console.error("Error fetching university stats:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [
        filters.startDate?.toISOString(), 
        filters.endDate?.toISOString(), 
        filters.facultyId, 
        filters.departmentId, 
        filters.problemCategoryId, 
        filters.gender
    ]); // Re-fetch when filters change

    return { stats, analytics, facultyBreakdown, riskTrends, isLoading, error };
}
