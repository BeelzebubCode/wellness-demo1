"use client";

import { useState, useEffect } from "react";
import { getMinistryStats, getRiskyUniversities, getMinistryRiskDistribution } from "../actions";

export interface MinistryStats {
  totalUniversities: number;
  totalStudents: number;
  totalBookings: number;
  highRiskCases: number;
  nationalAvgRisk: number;
  criticalUniversities: number;
}

export interface UniversityRiskData {
  id: number;
  name: string;
  code: string;
  highRiskCount: number;
}

export interface RiskDistributionItem {
    level: number;
    count: number;
    label: string;
}

export function useMinistryStats() {
  const [stats, setStats] = useState<MinistryStats | null>(null);
  const [riskyUnis, setRiskyUnis] = useState<UniversityRiskData[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistributionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        try {
            const [s, r, d] = await Promise.all([
                getMinistryStats(),
                getRiskyUniversities(),
                getMinistryRiskDistribution()
            ]);
            
            if (s) setStats(s as MinistryStats);
            setRiskyUnis(r);
            setRiskDistribution(d);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    fetchData();
  }, []);

  return { stats, riskyUnis, riskDistribution, isLoading };
}
