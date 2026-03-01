"use client";

import { useState, useEffect, useCallback } from "react";

interface AssignedCountResponse {
    success: boolean;
    data: {
        count: number;
    };
}

export function useConsultantAssignedCount() {
    const [count, setCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchCount = useCallback(async () => {
        try {
            const res = await fetch("/api/v2/consultants/me/bookings/assigned-count");
            if (res.ok) {
                const json = (await res.json()) as AssignedCountResponse;
                setCount(json.data?.count ?? 0);
            }
        } catch (e) {
            console.error("Failed to fetch assigned count", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchCount();

        // Poll every 60 seconds
        const interval = setInterval(fetchCount, 60000);

        // Also listen to manual refresh commands
        const handleRefresh = () => fetchCount();
        window.addEventListener("refresh-consultant-assigned-count", handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener("refresh-consultant-assigned-count", handleRefresh);
        };
    }, [fetchCount]);

    return { data: count, isLoading, refetch: fetchCount };
}
