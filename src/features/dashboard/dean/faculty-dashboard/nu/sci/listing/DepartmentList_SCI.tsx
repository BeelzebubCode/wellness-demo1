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

export const MOCK_DEPARTMENTS_NU_SCI: DepartmentStat[] = [
  { 
    id: "1", code: "NU_BIO", name: "ภาควิชาชีววิทยา", students: 200, sessions: 30, perStudent: 0.15,
    riskData: [
      { name: "วิกฤต (Critical)", value: 2, color: "#ef4444" },
      { name: "สูง (High)", value: 5, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 25, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 168, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 5 },
      { month: "ก.พ.", sessions: 8 },
      { month: "มี.ค.", sessions: 10 },
      { month: "เม.ย.", sessions: 12 },
      { month: "พ.ค.", sessions: 20 },
      { month: "มิ.ย.", sessions: 30 },
    ],
    topProblems: [
      { name: "ความเครียดแล็บ", male: 5, female: 10, other: 5, total: 20 },
      { name: "การเรียน", male: 5, female: 5, other: 2, total: 12 },
      { name: "ความวิตกกังวล", male: 2, female: 5, other: 1, total: 8 },
    ]
  },
  { 
    id: "2", code: "NU_CHEM", name: "ภาควิชาเคมี", students: 180, sessions: 25, perStudent: 0.14,
    riskData: [
      { name: "วิกฤต (Critical)", value: 3, color: "#ef4444" },
      { name: "สูง (High)", value: 8, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 30, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 139, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 8 },
      { month: "ก.พ.", sessions: 10 },
      { month: "มี.ค.", sessions: 12 },
      { month: "เม.ย.", sessions: 15 },
      { month: "พ.ค.", sessions: 18 },
      { month: "มิ.ย.", sessions: 25 },
    ],
    topProblems: [
      { name: "อันตรายสารเคมี", male: 10, female: 5, other: 5, total: 20 },
      { name: "การเรียน", male: 8, female: 5, other: 2, total: 15 },
      { name: "สุขภาพ", male: 5, female: 3, other: 2, total: 10 },
    ]
  },
  { 
    id: "3", code: "NU_PHY", name: "ภาควิชาฟิสิกส์", students: 150, sessions: 20, perStudent: 0.13,
    riskData: [
      { name: "วิกฤต (Critical)", value: 1, color: "#ef4444" },
      { name: "สูง (High)", value: 5, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 20, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 124, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 4 },
      { month: "ก.พ.", sessions: 6 },
      { month: "มี.ค.", sessions: 8 },
      { month: "เม.ย.", sessions: 10 },
      { month: "พ.ค.", sessions: 15 },
      { month: "มิ.ย.", sessions: 20 },
    ],
    topProblems: [
      { name: "ความยากเนื้อหา", male: 10, female: 5, other: 0, total: 15 },
      { name: "Burnout", male: 5, female: 2, other: 1, total: 8 },
      { name: "การปรับตัว", male: 2, female: 2, other: 1, total: 5 },
    ]
  },
  { 
    id: "4", code: "NU_MATH", name: "ภาควิชาคณิตศาสตร์", students: 120, sessions: 15, perStudent: 0.12,
    riskData: [
      { name: "วิกฤต (Critical)", value: 0, color: "#ef4444" },
      { name: "สูง (High)", value: 3, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 15, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 102, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 2 },
      { month: "ก.พ.", sessions: 4 },
      { month: "มี.ค.", sessions: 6 },
      { month: "เม.ย.", sessions: 8 },
      { month: "พ.ค.", sessions: 12 },
      { month: "มิ.ย.", sessions: 15 },
    ],
    topProblems: [
      { name: "ความเครียด", male: 5, female: 5, other: 0, total: 10 },
      { name: "การเรียน", male: 4, female: 1, other: 0, total: 5 },
      { name: "อื่นๆ", male: 2, female: 0, other: 0, total: 2 },
    ]
  },
  { 
    id: "5", code: "NU_CS", name: "ภาควิชาวิทยาการคอมพิวเตอร์", students: 250, sessions: 40, perStudent: 0.16,
    riskData: [
      { name: "วิกฤต (Critical)", value: 4, color: "#ef4444" },
      { name: "สูง (High)", value: 12, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 40, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 194, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 10 },
      { month: "ก.พ.", sessions: 15 },
      { month: "มี.ค.", sessions: 20 },
      { month: "เม.ย.", sessions: 25 },
      { month: "พ.ค.", sessions: 35 },
      { month: "มิ.ย.", sessions: 40 },
    ],
    topProblems: [
      { name: "Burnout", male: 15, female: 8, other: 7, total: 30 },
      { name: "Office Syndrome", male: 10, female: 5, other: 5, total: 20 },
      { name: "การนอนหลับ", male: 8, female: 4, other: 3, total: 15 },
    ]
  }
];
