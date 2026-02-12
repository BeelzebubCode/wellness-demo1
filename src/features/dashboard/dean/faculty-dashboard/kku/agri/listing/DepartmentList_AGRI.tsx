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

export const MOCK_DEPARTMENTS_KKU_AGRI: DepartmentStat[] = [
  { 
    id: "1", code: "KKU_AGRO", name: "ภาควิชาพืชไร่", students: 150, sessions: 20, perStudent: 0.13,
    riskData: [
      { name: "วิกฤต (Critical)", value: 2, color: "#ef4444" },
      { name: "สูง (High)", value: 5, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 20, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 123, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 5 },
      { month: "ก.พ.", sessions: 8 },
      { month: "มี.ค.", sessions: 10 },
      { month: "เม.ย.", sessions: 12 },
      { month: "พ.ค.", sessions: 15 },
      { month: "มิ.ย.", sessions: 20 },
    ],
    topProblems: [
      { name: "การเงิน", male: 8, female: 5, other: 2, total: 15 },
      { name: "การเรียน", male: 5, female: 5, other: 2, total: 12 },
      { name: "ครอบครัว", male: 2, female: 5, other: 1, total: 8 },
    ]
  },
  { 
    id: "2", code: "KKU_ANIM", name: "ภาควิชาสัตวบาล", students: 120, sessions: 15, perStudent: 0.12,
    riskData: [
      { name: "วิกฤต (Critical)", value: 1, color: "#ef4444" },
      { name: "สูง (High)", value: 4, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 15, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 100, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 3 },
      { month: "ก.พ.", sessions: 5 },
      { month: "มี.ค.", sessions: 8 },
      { month: "เม.ย.", sessions: 10 },
      { month: "พ.ค.", sessions: 12 },
      { month: "มิ.ย.", sessions: 15 },
    ],
    topProblems: [
      { name: "การทำงาน", male: 5, female: 5, other: 0, total: 10 },
      { name: "ความเครียด", male: 3, female: 2, other: 1, total: 6 },
      { name: "เพื่อน", male: 1, female: 1, other: 0, total: 2 },
    ]
  },
  { 
    id: "3", code: "KKU_HORT", name: "ภาควิชาพืชสวน", students: 100, sessions: 10, perStudent: 0.10,
    riskData: [
      { name: "วิกฤต (Critical)", value: 0, color: "#ef4444" },
      { name: "สูง (High)", value: 2, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 10, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 88, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 2 },
      { month: "ก.พ.", sessions: 3 },
      { month: "มี.ค.", sessions: 5 },
      { month: "เม.ย.", sessions: 6 },
      { month: "พ.ค.", sessions: 8 },
      { month: "มิ.ย.", sessions: 10 },
    ],
    topProblems: [
      { name: "การเรียน", male: 3, female: 3, other: 0, total: 6 },
      { name: "การปรับตัว", male: 2, female: 1, other: 0, total: 3 },
      { name: "สุขภาพ", male: 1, female: 1, other: 0, total: 2 },
    ]
  },
  { 
    id: "4", code: "KKU_SOIL", name: "ภาควิชาปฐพีวิทยา", students: 80, sessions: 8, perStudent: 0.10,
    riskData: [
      { name: "วิกฤต (Critical)", value: 1, color: "#ef4444" },
      { name: "สูง (High)", value: 3, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 8, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 68, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 1 },
      { month: "ก.พ.", sessions: 2 },
      { month: "มี.ค.", sessions: 3 },
      { month: "เม.ย.", sessions: 4 },
      { month: "พ.ค.", sessions: 6 },
      { month: "มิ.ย.", sessions: 8 },
    ],
    topProblems: [
      { name: "ค่าใช้จ่าย", male: 2, female: 2, other: 1, total: 5 },
      { name: "ความเครียด", male: 1, female: 1, other: 0, total: 2 },
      { name: "อื่นๆ", male: 1, female: 0, other: 0, total: 1 },
    ]
  }
];
