"use client";

import { useState, useEffect } from "react";
import { getAdviseeStats, getMyStudents, getAdvisorRiskTrends } from "../actions";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export interface AdvisorStats {
  totalStudents: number;
  activeCases: number;
  highRiskRecent: number;
}

export interface StudentListItem {
  id: number;
  code: string | null;
  name: string;
  faculty: string | undefined;
  latestRisk: number;
  lastActivity: Date | null;
}

export interface RiskTrendItem {
    month: string;
    averageRisk: number;
}

export interface AdvisorFilters {
  search?: string;
  riskLevel?: string;
}

export function useAdvisorStats() {
  const { user } = useRoleAuth({ 
    allowedRoles: ["ADVISOR"], 
    guard: false,
    loginToastKey: "advisor_login_toast"
  });
  
  const [stats, setStats] = useState<AdvisorStats | null>(null);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [riskTrends, setRiskTrends] = useState<RiskTrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<AdvisorFilters>({ riskLevel: "ALL" });

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
        setIsLoading(true);
        try {
            // Fetch basic stats and trends once or always? 
            // Trends usually don't change with search filters unless we filter trends too.
            // Requirement said "Update students list". 
            // Let's refetch everything to be safe or optimize later.
            // Stats (active cases) might be affected by search? PROBABLY NOT.
            // Let's assume KPI cards are global for advisor, but Table is filtered.
            // We will fetch everything for simplicity, but only pass filters to getMyStudents.
            
            const [s, st, rt] = await Promise.all([
                getAdviseeStats(user!),
                getMyStudents(user!, filters),
                getAdvisorRiskTrends(user!)
            ]);
            
            if (s) setStats(s);
            setStudents(st);
            setRiskTrends(rt);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    // Debounce search slightly if we were doing generic input, 
    // but FilterBar usually controls "apply". 
    // If FilterBar updates state instantly, we might need debounce. 
    // For now, simple effect dependency.
    const timer = setTimeout(() => {
        fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [user, filters]); // depend on filters

  return { stats, students, riskTrends, isLoading, filters, setFilters };
}
