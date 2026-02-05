import { useState, useEffect } from "react";
import { getRectorKPI, getMentalHealthTrends, getRectorRiskDistribution, getFacultyStats } from "../actions";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export interface RectorStatsData {
  kpi: {
    totalUsers: number;
    closedCases: number;
    highRisk: number;
    satisfaction: number;
  };
  mentalHealth: any;
  riskLevels: any;
  facultyStats: any;
}

export interface RectorFilters {
  startDate?: string;
  endDate?: string;
}

export function useRectorStats() {
  const { user } = useRoleAuth({ 
    allowedRoles: ["RECTOR"], 
    guard: false,
    loginToastKey: "rector_login_toast" 
  });
  
  const [data, setData] = useState<RectorStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<RectorFilters>({});

  useEffect(() => {
    // Cast user to any to access dynamic properties not in base AuthUser type
    const activeUniId = user ? (user as any).activeUniversityId : undefined;
    if (!user || !activeUniId) return;

    async function fetchData() {
        setIsLoading(true);
        try {
            const universityId = activeUniId as number;
            
            const [kpi, mh, risk, fac] = await Promise.all([
                getRectorKPI(universityId, filters),
                getMentalHealthTrends(universityId, filters),
                getRectorRiskDistribution(universityId, filters),
                getFacultyStats(universityId, filters)
            ]);
            
            setData({
                kpi: kpi || { totalUsers: 0, closedCases: 0, highRisk: 0, satisfaction: 0 },
                mentalHealth: mh,
                riskLevels: risk,
                facultyStats: fac
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    fetchData();
  }, [user, filters]);

  return { data, isLoading, filters, setFilters };
}
