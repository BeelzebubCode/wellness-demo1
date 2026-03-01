"use client";

import { useState, useEffect, useCallback } from "react";

interface PendingCountResponse {
    ok: boolean;
    data: {
        count: number;
    };
}

export function usePendingAssignmentsCount() {
    const [count, setCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchCount = useCallback(async () => {
        try {
            const res = await fetch("/api/v2/head-consultant/bookings/pending-count");
            if (res.ok) {
                const json = (await res.json()) as PendingCountResponse;
                setCount(json.data?.count ?? 0);
            }
        } catch (e) {
            console.error("Failed to fetch pending count", e);
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
        window.addEventListener("refresh-pending-count", handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener("refresh-pending-count", handleRefresh);
        };
    }, [fetchCount]);

    return { data: count, isLoading, refetch: fetchCount };
}
