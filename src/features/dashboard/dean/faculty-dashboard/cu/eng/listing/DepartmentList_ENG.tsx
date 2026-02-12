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

export const MOCK_DEPARTMENTS_ENG: DepartmentStat[] = [
  { 
    id: "1", code: "ENG_CIV", name: "ภาควิชาวิศวกรรมโยธา", students: 250, sessions: 35, perStudent: 0.14,
    riskData: [
      { name: "วิกฤต (Critical)", value: 2, color: "#ef4444" },
      { name: "สูง (High)", value: 8, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 30, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 210, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 10 },
      { month: "ก.พ.", sessions: 12 },
      { month: "มี.ค.", sessions: 15 },
      { month: "เม.ย.", sessions: 18 },
      { month: "พ.ค.", sessions: 25 },
      { month: "มิ.ย.", sessions: 35 },
    ],
    topProblems: [
      { name: "ความเครียดโปรเจกต์", male: 15, female: 5, other: 5, total: 25 },
      { name: "การจัดการเวลา", male: 10, female: 8, other: 2, total: 20 },
      { name: "ความสัมพันธ์", male: 5, female: 3, other: 2, total: 10 },
    ]
  },
  { 
    id: "2", code: "ENG_EE", name: "ภาควิชาวิศวกรรมไฟฟ้า", students: 300, sessions: 45, perStudent: 0.15,
    riskData: [
      { name: "วิกฤต (Critical)", value: 5, color: "#ef4444" },
      { name: "สูง (High)", value: 15, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 40, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 240, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 15 },
      { month: "ก.พ.", sessions: 20 },
      { month: "มี.ค.", sessions: 25 },
      { month: "เม.ย.", sessions: 30 },
      { month: "พ.ค.", sessions: 38 },
      { month: "มิ.ย.", sessions: 45 },
    ],
    topProblems: [
      { name: "เนื้อหาการเรียนยาก", male: 20, female: 10, other: 5, total: 35 },
      { name: "นอนไม่หลับ", male: 15, female: 5, other: 5, total: 25 },
      { name: "หมดไฟ", male: 10, female: 5, other: 5, total: 20 },
    ]
  },
  { 
    id: "3", code: "ENG_ME", name: "ภาควิชาวิศวกรรมเครื่องกล", students: 280, sessions: 28, perStudent: 0.10,
    riskData: [
      { name: "วิกฤต (Critical)", value: 3, color: "#ef4444" },
      { name: "สูง (High)", value: 10, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 35, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 232, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 8 },
      { month: "ก.พ.", sessions: 12 },
      { month: "มี.ค.", sessions: 15 },
      { month: "เม.ย.", sessions: 18 },
      { month: "พ.ค.", sessions: 22 },
      { month: "มิ.ย.", sessions: 28 },
    ],
    topProblems: [
      { name: "ความกดดัน", male: 15, female: 5, other: 5, total: 25 },
      { name: "การปรับตัว", male: 10, female: 5, other: 3, total: 18 },
      { name: "การเงิน", male: 5, female: 2, other: 1, total: 8 },
    ]
  },
  { 
    id: "4", code: "ENG_CP", name: "ภาควิชาวิศวกรรมคอมพิวเตอร์", students: 320, sessions: 60, perStudent: 0.19,
    riskData: [
      { name: "วิกฤต (Critical)", value: 8, color: "#ef4444" },
      { name: "สูง (High)", value: 20, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 50, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 242, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 20 },
      { month: "ก.พ.", sessions: 25 },
      { month: "มี.ค.", sessions: 35 },
      { month: "เม.ย.", sessions: 40 },
      { month: "พ.ค.", sessions: 50 },
      { month: "มิ.ย.", sessions: 60 },
    ],
    topProblems: [
      { name: "Burnout", male: 25, female: 10, other: 10, total: 45 },
      { name: "Offce Syndrome", male: 15, female: 5, other: 5, total: 25 },
      { name: "Social Anxiety", male: 10, female: 5, other: 5, total: 20 },
    ]
  },
  { 
    id: "5", code: "ENG_IE", name: "ภาควิชาวิศวกรรมอุตสาหการ", students: 200, sessions: 20, perStudent: 0.10,
    riskData: [
      { name: "วิกฤต (Critical)", value: 1, color: "#ef4444" },
      { name: "สูง (High)", value: 5, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 20, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 174, color: "#10b981" },
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
      { name: "กังวลเรื่องงาน", male: 8, female: 8, other: 4, total: 20 },
      { name: "การเรียน", male: 5, female: 5, other: 2, total: 12 },
      { name: "ครอบครัว", male: 3, female: 3, other: 1, total: 7 },
    ]
  }
];
