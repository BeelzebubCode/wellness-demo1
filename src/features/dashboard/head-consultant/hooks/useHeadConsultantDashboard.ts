// features/dashboard/head-consultant/hooks/useHeadConsultantDashboard.ts
"use client";

import { useState, useEffect } from "react";
import {
  getBookingStats,
  getCategoryDistribution,
  getTopStudents,
  getConsultantRatings,
  getTeamOverview,
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

// ── Hook ───────────────────────────────────
export function useHeadConsultantDashboard() {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [ratings, setRatings] = useState<ConsultantRating[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [s, c, t, r, tm] = await Promise.all([
          getBookingStats(),
          getCategoryDistribution(),
          getTopStudents(),
          getConsultantRatings(),
          getTeamOverview(),
        ]);

        if (s) setStats(s);
        setCategories(c);
        setTopStudents(t);
        setRatings(r);
        setTeam(tm);
      } catch (err) {
        console.error("Dashboard data fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, []);

  return { stats, categories, topStudents, ratings, team, isLoading };
}
