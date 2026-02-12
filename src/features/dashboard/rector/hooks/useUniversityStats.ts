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
        highRiskCount: number;
        mediumRiskCount: number;
        lowRiskCount: number;
    }>;
    riskTrends: Array<{
        month: string;
        averageRisk: number;
    }>;
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

interface DateRange {
    from?: Date;
    to?: Date;
}

export function useUniversityStats(dateRange?: DateRange) {
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
                // Build query string with date parameters
                const params = new URLSearchParams();
                if (dateRange?.from) {
                    params.append("startDate", dateRange.from.toISOString());
                }
                if (dateRange?.to) {
                    params.append("endDate", dateRange.to.toISOString());
                }

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
                        problemStats: data.problemStats,
                        genderProblemStats: data.genderProblemStats,
                        visitsByMonth: data.visitsByMonth,
                        repeatStats: data.repeatStats,
                        facultyBreakdown: data.facultyBreakdown || [],
                        riskTrends: data.riskTrends || [],
                        wellbeing: data.wellbeing,
                        healthMap: data.healthMap,
                    });

                    setAnalytics({
                        problemStats: data.problemStats,
                        genderProblemStats: data.genderProblemStats,
                        visitsByMonth: data.visitsByMonth,
                        repeatStats: data.repeatStats,
                        riskDistribution: data.riskDistribution,
                        // Add new analytics data if needed
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
    }, [dateRange?.from, dateRange?.to]); // Re-fetch when date range changes

    return { stats, analytics, facultyBreakdown, riskTrends, isLoading, error };
}
