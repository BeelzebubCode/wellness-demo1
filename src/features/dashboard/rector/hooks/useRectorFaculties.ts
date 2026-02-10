"use client";

import { useEffect, useState } from "react";

interface Faculty {
    id: string;
    code: string;
    name: string;
    nameEn: string | null;
    universityId: number;
    universityCode: string;
    universityName: string;
    studentCount: number;
    departmentCount: number;
    educationFieldGroup?: string | null;
    educationFieldGroupTH?: string | null;
    logo?: string;
}

export function useRectorFaculties() {
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchFaculties() {
            try {
                setIsLoading(true);
                const response = await fetch("/api/v2/rector/faculties");
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Failed to fetch faculties");
                }

                if (result.success) {
                    setFaculties(result.data);
                } else {
                    throw new Error(result.error || "Unknown error");
                }
            } catch (err: any) {
                console.error("Error fetching faculties:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchFaculties();
    }, []);

    return { faculties, isLoading, error };
}
