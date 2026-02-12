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

export const MOCK_DEPARTMENTS_MU_MED: DepartmentStat[] = [
  { 
    id: "1", code: "MU_MED", name: "ภาควิชาอายุรศาสตร์", students: 300, sessions: 50, perStudent: 0.17,
    riskData: [
      { name: "วิกฤต (Critical)", value: 4, color: "#ef4444" },
      { name: "สูง (High)", value: 10, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 40, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 246, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 15 },
      { month: "ก.พ.", sessions: 20 },
      { month: "มี.ค.", sessions: 28 },
      { month: "เม.ย.", sessions: 25 },
      { month: "พ.ค.", sessions: 40 },
      { month: "มิ.ย.", sessions: 50 },
    ],
    topProblems: [
      { name: "Burnout", male: 15, female: 10, other: 5, total: 30 },
      { name: "ความกดดัน", male: 10, female: 10, other: 5, total: 25 },
      { name: "การนอนหลับ", male: 5, female: 5, other: 2, total: 12 },
    ]
  },
  { 
    id: "2", code: "MU_SUR", name: "ภาควิชาศัลยศาสตร์", students: 200, sessions: 40, perStudent: 0.20,
    riskData: [
      { name: "วิกฤต (Critical)", value: 3, color: "#ef4444" },
      { name: "สูง (High)", value: 8, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 35, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 154, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 10 },
      { month: "ก.พ.", sessions: 12 },
      { month: "มี.ค.", sessions: 18 },
      { month: "เม.ย.", sessions: 15 },
      { month: "พ.ค.", sessions: 30 },
      { month: "มิ.ย.", sessions: 40 },
    ],
    topProblems: [
      { name: "ความเครียด", male: 20, female: 5, other: 5, total: 30 },
      { name: "เวลาพักผ่อน", male: 15, female: 5, other: 2, total: 22 },
      { name: "ความสัมพันธ์", male: 5, female: 2, other: 1, total: 8 },
    ]
  },
  { 
    id: "3", code: "MU_PED", name: "ภาควิชากุมารเวชศาสตร์", students: 150, sessions: 20, perStudent: 0.13,
    riskData: [
      { name: "วิกฤต (Critical)", value: 1, color: "#ef4444" },
      { name: "สูง (High)", value: 5, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 20, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 124, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 5 },
      { month: "ก.พ.", sessions: 8 },
      { month: "มี.ค.", sessions: 10 },
      { month: "เม.ย.", sessions: 8 },
      { month: "พ.ค.", sessions: 15 },
      { month: "มิ.ย.", sessions: 20 },
    ],
    topProblems: [
      { name: "ความวิตกกังวล", male: 5, female: 10, other: 2, total: 17 },
      { name: "การปรับตัว", male: 2, female: 5, other: 1, total: 8 },
      { name: "การเงิน", male: 1, female: 2, other: 0, total: 3 },
    ]
  },
  { 
    id: "4", code: "MU_RAD", name: "ภาควิชารังสีวิทยา", students: 100, sessions: 5, perStudent: 0.05,
    riskData: [
      { name: "วิกฤต (Critical)", value: 0, color: "#ef4444" },
      { name: "สูง (High)", value: 2, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 5, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 93, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 1 },
      { month: "ก.พ.", sessions: 2 },
      { month: "มี.ค.", sessions: 3 },
      { month: "เม.ย.", sessions: 2 },
      { month: "พ.ค.", sessions: 4 },
      { month: "มิ.ย.", sessions: 5 },
    ],
    topProblems: [
      { name: "การเรียน", male: 2, female: 2, other: 0, total: 4 },
      { name: "ความเครียด", male: 1, female: 1, other: 0, total: 2 },
      { name: "อื่นๆ", male: 0, female: 0, other: 1, total: 1 },
    ]
  },
  { 
    id: "5", code: "MU_ANES", name: "ภาควิชาวิสัญญีวิทยา", students: 80, sessions: 8, perStudent: 0.10,
    riskData: [
      { name: "วิกฤต (Critical)", value: 1, color: "#ef4444" },
      { name: "สูง (High)", value: 3, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 10, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 66, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 2 },
      { month: "ก.พ.", sessions: 3 },
      { month: "มี.ค.", sessions: 4 },
      { month: "เม.ย.", sessions: 3 },
      { month: "พ.ค.", sessions: 6 },
      { month: "มิ.ย.", sessions: 8 },
    ],
    topProblems: [
      { name: "ความรับผิดชอบ", male: 3, female: 2, other: 1, total: 6 },
      { name: "การพักผ่อน", male: 2, female: 1, other: 0, total: 3 },
      { name: "ครอบครัว", male: 1, female: 0, other: 0, total: 1 },
    ]
  }
];
