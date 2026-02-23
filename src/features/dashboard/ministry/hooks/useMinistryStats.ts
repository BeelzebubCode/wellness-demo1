"use client";

import { useState, useEffect } from "react";
import { getMinistryStats, getRiskyUniversities, getMinistryRiskDistribution } from "../actions";
import type { MinistryStats, UniversityRiskData, RiskDistributionItem } from "../services/ministry-types";

// Re-export types so existing consumers don't break
export type { MinistryStats, UniversityRiskData, RiskDistributionItem } from "../services/ministry-types";

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
