"use client";

import { useState, useEffect } from "react";
import { getAdviseeStats, getMyStudents, getAdvisorRiskTrends, getAdvisorAnalytics } from "../actions";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";
import { AdvisorDashboardFilters } from "../types";

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

export function useAdvisorStats() {
  const { user } = useRoleAuth({ 
    allowedRoles: ["ADVISOR"], 
    guard: false,
    loginToastKey: "advisor_login_toast"
  });
  
  const [stats, setStats] = useState<AdvisorStats | null>(null);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [riskTrends, setRiskTrends] = useState<RiskTrendItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Full filter state (expanded from just riskLevel)
  const [filters, setFilters] = useState<AdvisorDashboardFilters>(() => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date(to);
    from.setDate(from.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    return { startDate: from, endDate: to };
  });

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
        setIsLoading(true);
        try {
            const [s, st, rt, an] = await Promise.all([
                getAdviseeStats(user!),
                getMyStudents(user!, { search: filters.search, riskLevel: filters.riskLevel }),
                getAdvisorRiskTrends(user!, {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                }),
                getAdvisorAnalytics(user!, {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    problemCategoryId: filters.problemCategoryId,
                    gender: filters.gender,
                }),
            ]);
            
            if (s) setStats(s);
            setStudents(st);
            setRiskTrends(rt);
            if (an) setAnalytics(an);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    const timer = setTimeout(() => {
        fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    user, 
    filters.search, 
    filters.riskLevel,
    filters.startDate?.toISOString(),
    filters.endDate?.toISOString(),
    filters.problemCategoryId,
    filters.gender,
  ]);

  return { stats, students, riskTrends, analytics, isLoading, filters, setFilters };
}
