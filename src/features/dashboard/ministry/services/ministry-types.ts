// src/features/dashboard/ministry/services/ministry-types.ts
// Centralized types for the Ministry dashboard feature

// ─── Risk Metrics (HeatMap Dashboard) ────────────────────────────────────────

export interface UniversityRiskMetrics {
  universityId: number;
  universityCode: string;
  universityName: string;
  universityType: string;
  province: string;
  regionCode: string;
  regionName: string;
  queueSize: number;
  avgWaitTime: number;
  highRiskPercentage: number;
  therapistUtilization: number;
  riskScore: number;
}

export interface RegionalRiskMetrics {
  regionCode: string;
  regionName: string;
  totalUniversities: number;
  avgRiskScore: number;
  totalQueue: number;
  avgWaitTime: number;
  highRiskPercentage: number;
  status: "normal" | "warning" | "critical";
}

export interface RiskMetricsResponse {
  universities: UniversityRiskMetrics[];
  regions: RegionalRiskMetrics[];
  metadata: {
    totalUniversities: number;
    dateRange: { start: string; end: string };
    filters: { region?: string; type?: string; days: number };
  };
}

export interface RiskMetricsFilters {
  region?: string;
  type?: string;
  days?: number;
}

// ─── Ministry Stats (Overview Dashboard) ─────────────────────────────────────

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

// ─── University Map ──────────────────────────────────────────────────────────

export interface UniversityMapData {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  lat: number;
  lng: number;
  region: string;
  regionCode: string;
  province: string;
  students: number;
  type: string;
  logo: string;
  dominantProblem?: string | null;
  dominantProblemCode?: string | null;
  dominantProblemTH?: string | null;
  dominantProblemCount: number;
  problemBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  granularStats: Record<string, Record<string, number>>;
}
