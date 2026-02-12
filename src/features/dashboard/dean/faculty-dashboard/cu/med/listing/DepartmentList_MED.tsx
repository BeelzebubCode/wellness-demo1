// src/features/dashboard/dean/faculty-dashboard/cu/med/listing/DepartmentList_MED.tsx
"use client";

import React from "react";
import { Users, GraduationCap, ArrowRight, BookOpen } from "lucide-react";

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

export const MOCK_DEPARTMENTS: DepartmentStat[] = [
  { 
    id: "1", code: "MED_MED", name: "ภาควิชาอายุรศาสตร์", students: 178, sessions: 42, perStudent: 0.23,
    riskData: [
      { name: "วิกฤต (Critical)", value: 5, color: "#ef4444" },
      { name: "สูง (High)", value: 12, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 45, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 116, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 12 },
      { month: "ก.พ.", sessions: 18 },
      { month: "มี.ค.", sessions: 25 },
      { month: "เม.ย.", sessions: 20 },
      { month: "พ.ค.", sessions: 35 },
      { month: "มิ.ย.", sessions: 42 },
    ],
    topProblems: [
      { name: "สุขภาพจิต/อารมณ์", male: 12, female: 8, other: 10, total: 30 },
      { name: "ความเครียด", male: 8, female: 12, other: 15, total: 35 },
      { name: "ความสัมพันธ์", male: 2, female: 3, other: 5, total: 10 },
    ]
  },
  { 
    id: "2", code: "MED_SUR", name: "ภาควิชาศัลยศาสตร์", students: 145, sessions: 28, perStudent: 0.19,
    riskData: [
      { name: "วิกฤต (Critical)", value: 2, color: "#ef4444" },
      { name: "สูง (High)", value: 8, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 30, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 105, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 8 },
      { month: "ก.พ.", sessions: 10 },
      { month: "มี.ค.", sessions: 15 },
      { month: "เม.ย.", sessions: 12 },
      { month: "พ.ค.", sessions: 22 },
      { month: "มิ.ย.", sessions: 28 },
    ],
    topProblems: [
      { name: "สุขภาพจิต/อารมณ์", male: 10, female: 15, other: 5, total: 30 },
      { name: "ความเครียด", male: 15, female: 10, other: 12, total: 37 },
      { name: "กฎหมาย/วินัย", male: 5, female: 5, other: 2, total: 12 },
    ]
  },
  { 
    id: "3", code: "MED_PED", name: "ภาควิชากุมารเวชศาสตร์", students: 120, sessions: 35, perStudent: 0.29,
    riskData: [
      { name: "วิกฤต (Critical)", value: 3, color: "#ef4444" },
      { name: "สูง (High)", value: 10, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 25, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 82, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 10 },
      { month: "ก.พ.", sessions: 15 },
      { month: "มี.ค.", sessions: 18 },
      { month: "เม.ย.", sessions: 16 },
      { month: "พ.ค.", sessions: 25 },
      { month: "มิ.ย.", sessions: 35 },
    ],
    topProblems: [
      { name: "สุขภาพจิต/อารมณ์", male: 8, female: 20, other: 12, total: 40 },
      { name: "ความเครียด", male: 12, female: 18, other: 10, total: 40 },
      { name: "การปรับตัว", male: 2, female: 5, other: 3, total: 10 },
    ]
  },
  { 
    id: "4", code: "MED_OBG", name: "ภาควิชาสูติศาสตร์-นรีเวชวิทยา", students: 105, sessions: 18, perStudent: 0.17,
    riskData: [
      { name: "วิกฤต (Critical)", value: 1, color: "#ef4444" },
      { name: "สูง (High)", value: 4, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 25, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 75, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 5 },
      { month: "ก.พ.", sessions: 8 },
      { month: "มี.ค.", sessions: 10 },
      { month: "เม.ย.", sessions: 7 },
      { month: "พ.ค.", sessions: 12 },
      { month: "มิ.ย.", sessions: 18 },
    ],
    topProblems: [
      { name: "สุขภาพจิต/อารมณ์", male: 5, female: 25, other: 10, total: 40 },
      { name: "ความเครียด", male: 10, female: 20, other: 15, total: 45 },
      { name: "ความสัมพันธ์", male: 5, female: 10, other: 5, total: 20 },
    ]
  },
  { 
    id: "5", code: "MED_ORT", name: "ภาควิชาออร์โธปิดิกส์", students: 92, sessions: 14, perStudent: 0.15,
    riskData: [
      { name: "วิกฤต (Critical)", value: 0, color: "#ef4444" },
      { name: "สูง (High)", value: 3, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 20, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 69, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 3 },
      { month: "ก.พ.", sessions: 5 },
      { month: "มี.ค.", sessions: 8 },
      { month: "เม.ย.", sessions: 4 },
      { month: "พ.ค.", sessions: 10 },
      { month: "มิ.ย.", sessions: 14 },
    ],
    topProblems: [
      { name: "สุขภาพจิต/อารมณ์", male: 15, female: 5, other: 10, total: 30 },
      { name: "ความเครียด", male: 12, female: 8, other: 10, total: 30 },
      { name: "สารเสพติด/การเสพติด", male: 10, female: 2, other: 3, total: 15 },
    ]
  },
  { 
    id: "6", code: "MED_PSY", name: "ภาควิชาจิตเวชศาสตร์", students: 65, sessions: 32, perStudent: 0.49,
    riskData: [
      { name: "วิกฤต (Critical)", value: 10, color: "#ef4444" },
      { name: "สูง (High)", value: 18, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 22, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 15, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 15 },
      { month: "ก.พ.", sessions: 20 },
      { month: "มี.ค.", sessions: 25 },
      { month: "เม.ย.", sessions: 22 },
      { month: "พ.ค.", sessions: 28 },
      { month: "มิ.ย.", sessions: 32 },
    ],
    topProblems: [
      { name: "สุขภาพจิต/อารมณ์", male: 15, female: 20, other: 25, total: 60 },
      { name: "ความเครียด", male: 10, female: 15, other: 20, total: 45 },
      { name: "ความสัมพันธ์", male: 8, female: 12, other: 10, total: 30 },
    ]
  },
  { 
    id: "7", code: "MED_RAD", name: "ภาควิชารังสีวิทยา", students: 80, sessions: 15, perStudent: 0.19,
    riskData: [
      { name: "วิกฤต (Critical)", value: 1, color: "#ef4444" },
      { name: "สูง (High)", value: 6, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 20, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 53, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 4 },
      { month: "ก.พ.", sessions: 7 },
      { month: "มี.ค.", sessions: 9 },
      { month: "เม.ย.", sessions: 6 },
      { month: "พ.ค.", sessions: 11 },
      { month: "มิ.ย.", sessions: 15 },
    ],
    topProblems: [
      { name: "สุขภาพจิต/อารมณ์", male: 8, female: 12, other: 5, total: 25 },
      { name: "ความเครียด", male: 12, female: 15, other: 8, total: 35 },
      { name: "ครอบครัว", male: 5, female: 5, other: 5, total: 15 },
    ]
  },
  { 
    id: "8", code: "MED_FML", name: "ภาควิชาเวชศาสตร์ครอบครัว", students: 115, sessions: 35, perStudent: 0.30,
    riskData: [
      { name: "วิกฤต (Critical)", value: 5, color: "#ef4444" },
      { name: "สูง (High)", value: 15, color: "#f97316" },
      { name: "ปานกลาง (Moderate)", value: 35, color: "#f59e0b" },
      { name: "ปกติ (Normal)", value: 60, color: "#10b981" },
    ],
    trendData: [
      { month: "ม.ค.", sessions: 12 },
      { month: "ก.พ.", sessions: 18 },
      { month: "มี.ค.", sessions: 22 },
      { month: "เม.ย.", sessions: 20 },
      { month: "พ.ค.", sessions: 30 },
      { month: "มิ.ย.", sessions: 35 },
    ],
    topProblems: [
      { name: "สุขภาพจิต/อารมณ์", male: 15, female: 20, other: 10, total: 45 },
      { name: "ครอบครัว", male: 10, female: 15, other: 20, total: 45 },
      { name: "ความเครียด", male: 12, female: 18, other: 10, total: 40 },
    ]
  },
];

interface Props {
  onSelect: (dept: DepartmentStat) => void;
}

export function DepartmentList_MED({ onSelect }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 mb-6 px-1">
         <div className="w-1.5 h-7 bg-[rgb(var(--primary))] rounded-full shrink-0 transform translate-y-[-4px]" />
         <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">รายชื่อภาควิชา (Department Statistics)</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {MOCK_DEPARTMENTS.map((dept) => (
          <button
            key={dept.id}
            onClick={() => onSelect(dept)}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-transform duration-300 border border-gray-200 hover:border-[rgb(var(--primary))] text-left h-full flex flex-col"
          >
            {/* Header Area */}
            <div className="bg-gradient-to-br from-[rgba(var(--primary),0.05)] to-[rgba(var(--accent),0.05)] p-6 border-b border-gray-100">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[rgb(var(--primary))] uppercase tracking-wider bg-white/80 px-2 py-1 rounded-md shadow-sm">
                    {dept.code}
                  </span>
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-[rgb(var(--primary))] group-hover:text-white transition-colors">
                    <GraduationCap className="w-5 h-5 text-[rgb(var(--primary))] group-hover:text-white" />
                  </div>
               </div>
               <h3 className="font-bold text-lg text-gray-900 group-hover:text-[rgb(var(--primary))] transition-colors line-clamp-2 min-h-[3.5rem]">
                {dept.name}
              </h3>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-grow flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>Students</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dept.students.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>Total Case</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dept.sessions.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-50">
                  <span className="text-gray-400 italic">Case per Students</span>
                  <span className="font-bold text-[rgb(var(--primary))] bg-[rgba(var(--primary),0.1)] px-2 py-0.5 rounded">
                    {dept.perStudent.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4">
                <div className="flex items-center gap-1 text-xs font-semibold text-[rgb(var(--primary))] group-hover:translate-x-1 transition-all">
                   View Dashboard
                   <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
