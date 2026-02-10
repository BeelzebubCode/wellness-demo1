"use client";

import { useEffect, useState } from "react";
import type { FacultyStats } from "../../dean/types";

export function useRectorFacultyStats(facultyCode?: string) {
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
                const url = `/api/v2/rector/dashboard?facultyCode=${encodeURIComponent(facultyCode)}`;

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
    }, [facultyCode]);

    return { stats, isLoading, error };
}
