// features/dashboard/head-consultant/hooks/useHeadConsultantDashboard.ts
"use client";

import { useState, useEffect } from "react";
import {
  getBookingStats,
  getCategoryDistribution,
  getTopStudents,
  getConsultantRatings,
  getTeamOverview,
  getRiskDistribution,
  getBookingTrend,
  getWorkloadBalance,
  getResponseTimeMetrics,
  getAttendanceInsights,
} from "../actions";

// ── Types ──────────────────────────────────
export interface BookingStats {
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalThisMonth: number;
}

export interface CategoryItem {
  categoryId: number;
  code: string;
  nameTh: string;
  nameEn: string | null;
  count: number;
}

export interface TopStudent {
  rank: number;
  studentId: number;
  studentCode: string | null;
  username: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  points: number;
}

export interface ConsultantRating {
  consultantId: number;
  firstName: string;
  lastName: string;
  prefix: string;
  feedbackCount: number;
  avgRating: number;
}

export interface TeamMember {
  consultantId: number;
  prefix: string;
  firstName: string;
  lastName: string;
  activeBookings: number;
  avgRating: number;
  feedbackCount: number;
  specializations: string[];
}

// ── NEW Types ──────────────────────────────
export interface RiskDistItem {
  riskLevelId: number | null;
  label: string;
  color: string;
  count: number;
}

export interface RiskDistributionData {
  distribution: RiskDistItem[];
  highRiskCount: number;
}

export interface BookingTrendItem {
  week: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface WorkloadItem {
  consultantId: number;
  name: string;
  activeCases: number;
}

export interface ResponseTimeData {
  avgAssignmentHours: number;
  avgConsultationHours: number;
  overdueCount: number;
}

export interface AttendanceData {
  checkedIn: number;
  late: number;
  noShow: number;
  pending: number;
  cancelledByConsultant: number;
  pendingExceptions: number;
}

// ── Hook ───────────────────────────────────
export function useHeadConsultantDashboard(dateRange?: { from?: Date; to?: Date }) {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [ratings, setRatings] = useState<ConsultantRating[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [riskDist, setRiskDist] = useState<RiskDistributionData>({ distribution: [], highRiskCount: 0 });
  const [trend, setTrend] = useState<BookingTrendItem[]>([]);
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [responseTime, setResponseTime] = useState<ResponseTimeData>({ avgAssignmentHours: 0, avgConsultationHours: 0, overdueCount: 0 });
  const [attendance, setAttendance] = useState<AttendanceData>({ checkedIn: 0, late: 0, noShow: 0, pending: 0, cancelledByConsultant: 0, pendingExceptions: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      // If we already have stats, we are just refreshing
      if (!stats) setIsLoading(true);
      setIsRefreshing(true);
      
      try {
        const fromStr = dateRange?.from?.toISOString();
        const toStr = dateRange?.to?.toISOString();

        const [s, c, t, r, tm, rd, bt, wl, rt, ai] = await Promise.all([
          getBookingStats(fromStr, toStr),
          getCategoryDistribution(fromStr, toStr),
          getTopStudents(), // Points are global
          getConsultantRatings(fromStr, toStr),
          getTeamOverview(fromStr, toStr),
          getRiskDistribution(fromStr, toStr),
          getBookingTrend(fromStr, toStr),
          getWorkloadBalance(),
          getResponseTimeMetrics(fromStr, toStr),
          getAttendanceInsights(fromStr, toStr),
        ]);

        if (s) setStats(s);
        setCategories(c);
        setTopStudents(t);
        setRatings(r);
        setTeam(tm);
        setRiskDist(rd);
        setTrend(bt);
        setWorkload(wl);
        setResponseTime(rt);
        setAttendance(ai);
      } catch (err) {
        console.error("Dashboard data fetch failed:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }

    fetchAll();
  }, [dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

  return { stats, categories, topStudents, ratings, team, riskDist, trend, workload, responseTime, attendance, isLoading, isRefreshing };
}
