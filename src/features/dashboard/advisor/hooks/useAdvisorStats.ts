"use client";

import { useState, useEffect } from "react";
import { getAdviseeStats, getMyStudents, getAdvisorRiskTrends, getAdvisorAnalytics } from "../actions";
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
  
  // ... inside useAdvisorStats ...
  const [stats, setStats] = useState<AdvisorStats | null>(null);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [riskTrends, setRiskTrends] = useState<RiskTrendItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null); // [NEW] Store comprehensive analytics
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<AdvisorFilters>({ riskLevel: "ALL" });

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
        setIsLoading(true);
        try {
            const [s, st, rt, an] = await Promise.all([
                getAdviseeStats(user!),
                getMyStudents(user!, filters),
                getAdvisorRiskTrends(user!),
                getAdvisorAnalytics(user!) // [NEW] Fetch analytics
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
  }, [user, filters]);

  return { stats, students, riskTrends, analytics, isLoading, filters, setFilters };
}
