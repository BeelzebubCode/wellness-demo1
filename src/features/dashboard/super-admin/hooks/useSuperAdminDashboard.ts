import { useState, useEffect } from "react";
import { getSystemStats, getUniversityGrowth } from "../actions";

export interface SystemStats {
  tenantCount: number;
  kbDocuments: number;
  pendingBorrowRequests: number;
  systemHealth: string;
  uptime: string;
}

export function useSuperAdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        try {
            const [s, g] = await Promise.all([
                getSystemStats(),
                getUniversityGrowth()
            ]);
            setStats(s);
            setGrowthData(g);
        } catch (error) {
            console.error("Failed to fetch super admin stats", error);
        } finally {
            setIsLoading(false);
        }
    }
    
    fetchData();
  }, []);

  return { stats, growthData, isLoading };
}
