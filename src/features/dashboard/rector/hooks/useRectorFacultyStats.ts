"use client";

import { useEffect, useState } from "react";
import type { FacultyStats } from "../../dean/types";

export function useRectorFacultyStats(facultyCode?: string, dateRange?: { from: Date; to: Date }) {
    const [stats, setStats] = useState<FacultyStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            if (!facultyCode) {
                setError("Faculty code is required");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const params = new URLSearchParams();
                params.append("facultyCode", facultyCode);

                if (dateRange?.from && dateRange?.to) {
                    params.append("startDate", dateRange.from.toISOString().split('T')[0]);
                    params.append("endDate", dateRange.to.toISOString().split('T')[0]);
                }

                const url = `/api/v2/rector/dashboard?${params.toString()}`;

                const response = await fetch(url);
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Failed to fetch faculty stats");
                }

                if (result.success) {
                    setStats(result.data);
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

        fetchStats();
    }, [facultyCode, dateRange]);

    return { stats, isLoading, error };
}
