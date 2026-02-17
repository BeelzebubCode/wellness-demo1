import { useState, useEffect, useCallback } from "react";

export interface DeanFacultyStats {
  facultyId: number;
  facultyCode: string;
  facultyName: string;
  facultyNameEn: string;
  universityCode: string;
  universityName: string;
  universityLogoUrl: string;
  subjectGroupCategory: string | null;
  academicYear: string;
  totalStudents: number;
  totalDepartments: number;
  totalBookings: number;
  activeCases: number;
  visitTrend: string;
  riskDistribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    NORMAL: number;
  };
  yearLevelDistribution: {
    YEAR_1: number;
    YEAR_2: number;
    YEAR_3: number;
    YEAR_4: number;
    YEAR_5_PLUS: number;
    UNKNOWN: number;
  };
  problemStats: Record<string, number>;
  genderProblemStats: Record<string, Record<string, number>>;
  visitsByMonth: Record<string, number>;
  repeatStats: {
    single: number;
    repeat: number;
  };
  departmentStats: Array<{
    departmentId: number;
    departmentCode: string;
    departmentName: string;
    departmentNameEn: string;
    studentCount: number;
    bookingCount: number;
    riskDistribution: {
      HIGH: number;
      MEDIUM: number;
      LOW: number;
      NORMAL: number;
    };
    problemStats: Record<string, number>;
    genderProblemStats: Record<string, Record<string, number>>;
    visitsByMonth: Record<string, number>;
  }>;
  consultantStats: Array<{
    id: number;
    name: string;
    count: number;
  }>;
  recentCases: Array<{
    id: string;
    name: string;
    risk: "NORMAL" | "MODERATE" | "HIGH" | "CRITICAL";
    problem: string;
    date: string;
    status: string;
    avatar: string;
    department: string;
    year: string;
    serviceMode: "ONSITE" | "ONLINE";
    gender: "MALE" | "FEMALE" | "OTHER";
  }>;
  strategicAnalysis: {
    riskGroup: { name: string; count: number; sub: string };
    topProblem: { name: string; count: number; sub: string };
  };
}

export function useDeanFacultyData(facultyCode?: string) {
  const [data, setData] = useState<DeanFacultyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (start?: Date, end?: Date) => {
    setLoading(true);
    try {
      let url = "/api/v2/dean/dashboard";
      const params = new URLSearchParams();
      if (facultyCode) params.append("facultyCode", facultyCode);
      if (start) params.append("startDate", start.toISOString().split("T")[0]);
      if (end) params.append("endDate", end.toISOString().split("T")[0]);
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to fetch data");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [facultyCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
