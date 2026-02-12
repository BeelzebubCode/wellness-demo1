"use client";

import React from "react";

export interface DepartmentStat {
  id: string;
  code: string;
  name: string;
  students: number;
  sessions: number;
  perStudent: number;
  riskData?: { name: string; value: number; color: string }[];
  trendData?: { month: string; sessions: number }[];
  topProblems?: { name: string; male: number; female: number; other: number; total: number }[];
}

export const MOCK_DEPARTMENTS_ABAC_BUS: DepartmentStat[] = [
  { 
    id: "1", code: "ABAC_MKT", name: "Marketing Department", students: 350, sessions: 45, perStudent: 0.13,
    riskData: [
      { name: "วิกฤต (Critical)", value: 4, color: "#ef4444" },
      { name: "สูง (High)", value: 10, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 35, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 301, color: "#10b981" },
    ],
    trendData: [
      { month: "Jan", sessions: 15 },
      { month: "Feb", sessions: 20 },
      { month: "Mar", sessions: 25 },
      { month: "Apr", sessions: 30 },
      { month: "May", sessions: 35 },
      { month: "Jun", sessions: 45 },
    ],
    topProblems: [
      { name: "Competition", male: 10, female: 15, other: 5, total: 30 },
      { name: "Presentation Anxiety", male: 8, female: 12, other: 3, total: 23 },
      { name: "Team Work", male: 5, female: 5, other: 2, total: 12 },
    ]
  },
  { 
    id: "2", code: "ABAC_FIN", name: "Finance Department", students: 300, sessions: 40, perStudent: 0.13,
    riskData: [
      { name: "วิกฤต (Critical)", value: 3, color: "#ef4444" },
      { name: "สูง (High)", value: 8, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 30, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 259, color: "#10b981" },
    ],
    trendData: [
      { month: "Jan", sessions: 12 },
      { month: "Feb", sessions: 15 },
      { month: "Mar", sessions: 20 },
      { month: "Apr", sessions: 25 },
      { month: "May", sessions: 30 },
      { month: "Jun", sessions: 40 },
    ],
    topProblems: [
      { name: "Academic Stress", male: 15, female: 10, other: 5, total: 30 },
      { name: "Career Anxiety", male: 10, female: 8, other: 2, total: 20 },
      { name: "Financial Issues", male: 5, female: 5, other: 1, total: 11 },
    ]
  },
  { 
    id: "3", code: "ABAC_MGT", name: "Management Department", students: 250, sessions: 30, perStudent: 0.12,
    riskData: [
      { name: "วิกฤต (Critical)", value: 2, color: "#ef4444" },
      { name: "สูง (High)", value: 6, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 25, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 217, color: "#10b981" },
    ],
    trendData: [
      { month: "Jan", sessions: 10 },
      { month: "Feb", sessions: 12 },
      { month: "Mar", sessions: 15 },
      { month: "Apr", sessions: 18 },
      { month: "May", sessions: 25 },
      { month: "Jun", sessions: 30 },
    ],
    topProblems: [
      { name: "Leadership Stress", male: 10, female: 5, other: 3, total: 18 },
      { name: "Work-Life Balance", male: 5, female: 5, other: 2, total: 12 },
      { name: "Conflict", male: 3, female: 3, other: 1, total: 7 },
    ]
  },
  { 
    id: "4", code: "ABAC_ACT", name: "Accounting Department", students: 280, sessions: 35, perStudent: 0.13,
    riskData: [
      { name: "วิกฤต (Critical)", value: 3, color: "#ef4444" },
      { name: "สูง (High)", value: 7, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 28, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 242, color: "#10b981" },
    ],
    trendData: [
      { month: "Jan", sessions: 10 },
      { month: "Feb", sessions: 15 },
      { month: "Mar", sessions: 18 },
      { month: "Apr", sessions: 22 },
      { month: "May", sessions: 28 },
      { month: "Jun", sessions: 35 },
    ],
    topProblems: [
      { name: "Burnout", male: 8, female: 12, other: 5, total: 25 },
      { name: "Perfectionism", male: 5, female: 10, other: 3, total: 18 },
      { name: "Ethics", male: 2, female: 3, other: 1, total: 6 },
    ]
  }
];
