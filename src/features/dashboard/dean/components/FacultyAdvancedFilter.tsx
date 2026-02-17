"use client";

import React from "react";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterDef } from "@/components/filters/types";
import { FacultyDateRangePicker } from "./FacultyDateRangePicker";
import {
  Users,
  Search,
  Filter,
  AlertTriangle,
  Zap
} from "lucide-react";

export interface FacultyFilters {
  search?: string;
  department?: string;
  yearLevel?: string;
  riskLevel?: string;
  problemCategory?: string;
  gender?: string;
  serviceMode?: string;
  status?: string;
}

export const FILTER_DEFS: FilterDef<FacultyFilters>[] = [
  {
    key: "department",
    label: "ภาควิชา (Department)",
    type: "select",
    options: [
      { label: "ทุกภาควิชา", value: "ALL" },
      { label: "ภาควิชาอายุรศาสตร์", value: "MED_MED" },
      { label: "ภาควิชาศัลยศาสตร์", value: "MED_SUR" },
      { label: "ภาควิชากุมารเวชศาสตร์", value: "MED_PED" },
      { label: "ภาควิชาจิตเวชศาสตร์", value: "MED_PSY" },
    ],
  },
  {
    key: "yearLevel",
    label: "ชั้นปี (Year Level)",
    type: "select",
    options: [
      { label: "ทุกชั้นปี", value: "ALL" },
      { label: "ชั้นปีที่ 1", value: "YEAR_1" },
      { label: "ชั้นปีที่ 2", value: "YEAR_2" },
      { label: "ชั้นปีที่ 3", value: "YEAR_3" },
      { label: "ชั้นปีที่ 4", value: "YEAR_4" },
      { label: "ปี 5 ขึ้นไป", value: "YEAR_5_PLUS" },
    ],
  },
  {
    key: "riskLevel",
    label: "ระดับความเสี่ยง (Risk Level)",
    type: "select",
    options: [
      { label: "ทุกระดับ", value: "ALL" },
      { label: "ปกติ (Normal)", value: "NORMAL" },
      { label: "ปานกลาง (Moderate)", value: "MODERATE" },
      { label: "สูง (High)", value: "HIGH" },
      { label: "วิกฤต (Critical)", value: "CRITICAL" },
    ],
  },
  {
    key: "problemCategory",
    label: "ประเภทปัญหา (Problem)",
    type: "select",
    options: [
      { label: "ทุกประเภท", value: "ALL" },
      { label: "สุขภาพจิต/อารมณ์", value: "MENTAL" },
      { label: "ความเครียด", value: "STRESS" },
      { label: "ความสัมพันธ์", value: "RELATION" },
      { label: "การปรับตัว", value: "ADAPT" },
    ],
  },
  {
    key: "gender",
    label: "เพศ (Gender)",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "ALL" },
      { label: "ชาย", value: "MALE" },
      { label: "หญิง", value: "FEMALE" },
      { label: "อื่นๆ", value: "OTHER" },
    ],
  },
];

interface FacultyAdvancedFilterProps {
  filters: FacultyFilters;
  onFilterChange: (filters: FacultyFilters) => void;
  activeQuickFilter: string;
  onQuickFilterChange: (id: string) => void;
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
}

export function FacultyAdvancedFilter({ 
  filters, 
  onFilterChange, 
  activeQuickFilter, 
  onQuickFilterChange,
  startDate,
  endDate,
  onDateRangeChange
}: FacultyAdvancedFilterProps) {
  
  const quickFilters = [
    { id: "all", label: "ทั้งหมด", icon: <Users className="w-3.5 h-3.5" /> },
    { id: "high-risk", label: "ความเสี่ยงสูง", icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-red-600 bg-red-50" },
    { id: "new-cases", label: "เคสใหม่สัปดาห์นี้", icon: <Zap className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-50" },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 p-10 border border-slate-100 relative mb-8">
      {/* Background Accent - Clipped to card boundaries */}
      <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
            <Filter className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">ระบบคัดกรองข้อมูลอัจฉริยะ</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Advanced Multi-dimensional Data Filtering</p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center gap-4 flex-wrap justify-end">
          <div className="flex-1 hidden xl:block"></div>
          {/* Quick Filters */}
          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 shrink-0 overflow-x-auto max-w-full">
            {quickFilters.map(sf => (
              <button
                key={sf.id}
                onClick={() => onQuickFilterChange(sf.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap
                   ${activeQuickFilter === sf.id
                    ? "bg-white shadow-md text-primary"
                    : "text-slate-400 hover:text-slate-600"
                  }
                 `}
              >
                {sf.icon}
                {sf.label}
              </button>
            ))}
          </div>

          {/* Date Range Picker */}
          <div className="flex-shrink-0">
            <FacultyDateRangePicker 
              startDate={startDate} 
              endDate={endDate} 
              onChange={onDateRangeChange || (() => {})}
            />
          </div>
        </div>
      </div>

      <FilterBar
        defs={FILTER_DEFS}
        value={filters}
        onChange={onFilterChange}
        searchKey="search"
        searchPlaceholder="ค้นหาตามชื่อนิสิต, รหัสประจำตัว, หรือรหัสเคสคำปรึกษา..."
      />
    </div>
  );
}
