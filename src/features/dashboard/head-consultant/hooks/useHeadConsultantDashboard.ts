// features/dashboard/head-consultant/hooks/useHeadConsultantDashboard.ts
"use client";

import { useState, useEffect } from "react";

export interface DashboardStats {
  pendingCases: number;
  activeCases: number;
  closedCases: number;
  highRiskCases: number;
}

export interface TeamMember {
  id: string;
  name: string;
  status: "active" | "busy" | "offline";
}

const MOCK_STATS: DashboardStats = {
  pendingCases: 3,
  activeCases: 12,
  closedCases: 45,
  highRiskCases: 2,
};

const MOCK_TEAM: TeamMember[] = [
  { id: "1", name: "Dr. A", status: "active" },
  { id: "2", name: "Dr. B", status: "busy" },
  { id: "3", name: "Dr. C", status: "active" },
  { id: "4", name: "Dr. D", status: "offline" },
  { id: "5", name: "Dr. E", status: "active" },
];

export function useHeadConsultantDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API
    setTimeout(() => {
      setStats(MOCK_STATS);
      setTeam(MOCK_TEAM);
      setIsLoading(false);
    }, 600);
  }, []);

  return { stats, team, isLoading };
}
