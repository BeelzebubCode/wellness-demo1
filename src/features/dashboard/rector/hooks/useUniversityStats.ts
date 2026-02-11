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
}

export function useUniversityStats() {
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
                const response = await fetch("/api/v2/rector/university-stats");
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
                    });

                    setAnalytics({
                        problemStats: data.problemStats,
                        genderProblemStats: data.genderProblemStats,
                        visitsByMonth: data.visitsByMonth,
                        repeatStats: data.repeatStats,
                        riskDistribution: data.riskDistribution,
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
    }, []);

    return { stats, analytics, facultyBreakdown, riskTrends, isLoading, error };
}
