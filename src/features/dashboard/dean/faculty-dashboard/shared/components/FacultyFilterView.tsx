"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterDef } from "@/components/filters/types";
import {
  Users,
  Search,
  MapPin,
  Filter,
  Calendar,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Brain,
  MoreHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download
} from "lucide-react";
import * as XLSX from 'xlsx';

interface FacultyFilters {
  search?: string;
  department?: string;
  yearLevel?: string;
  riskLevel?: string;
  problemCategory?: string;
  gender?: string;
  serviceMode?: string;
  status?: string;
}

const FILTER_DEFS: FilterDef<FacultyFilters>[] = [
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

interface CaseItem {
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
}

interface FacultyFilterViewProps {
  cases?: CaseItem[];
}

const ITEMS_PER_PAGE = 15;

const MOCK_CASES: CaseItem[] = [
  { id: "CASE-8821", name: "นิสิตปี 2 - อายุรศาสตร์", risk: "HIGH", problem: "ความเครียดจากการเรียน", date: "12 ก.พ. 2569", status: "กำลังดำเนินการ", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=A", department: "MED_MED", year: "YEAR_2", serviceMode: "ONSITE", gender: "MALE" },
  { id: "CASE-8819", name: "นิสิตปี 1 - ศัลยศาสตร์", risk: "CRITICAL", problem: "ปัญหาสุขภาพจิต/อารมณ์", date: "11 ก.พ. 2569", status: "ติดตามผล", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=B", department: "MED_SUR", year: "YEAR_1", serviceMode: "ONLINE", gender: "FEMALE" },
  { id: "CASE-8815", name: "นิสิตปี 4 - จิตเวชศาสตร์", risk: "NORMAL", problem: "การปรับตัว", date: "10 ก.พ. 2569", status: "ปิดเคสแล้ว", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=C", department: "MED_PSY", year: "YEAR_4", serviceMode: "ONSITE", gender: "OTHER" },
  { id: "CASE-8810", name: "นิสิตปี 3 - กุมารเวชศาสตร์", risk: "MODERATE", problem: "ความสัมพันธ์", date: "09 ก.พ. 2569", status: "นัดหมายครั้งถัดไป", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=D", department: "MED_PED", year: "YEAR_3", serviceMode: "ONLINE", gender: "MALE" },
  { id: "CASE-8805", name: "นิสิตปี 1 - อายุรศาสตร์", risk: "HIGH", problem: "ปัญหาสุขภาพจิต/อารมณ์", date: "08 ก.พ. 2569", status: "กำลังดำเนินการ", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=E", department: "MED_MED", year: "YEAR_1", serviceMode: "ONSITE", gender: "FEMALE" },
  { id: "CASE-8798", name: "นิสิตปี 5 - ศัลยศาสตร์", risk: "CRITICAL", problem: "ความเครียด", date: "07 ก.พ. 2569", status: "รอรับบัตร", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=F", department: "MED_SUR", year: "YEAR_5_PLUS", serviceMode: "ONLINE", gender: "MALE" },
  { id: "CASE-8790", name: "นิสิตปี 2 - จิตเวชศาสตร์", risk: "MODERATE", problem: "การปรับตัว", date: "06 ก.พ. 2569", status: "กำลังดำเนินการ", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=G", department: "MED_PSY", year: "YEAR_2", serviceMode: "ONSITE", gender: "FEMALE" },
  { id: "CASE-8785", name: "นิสิตปี 4 - กุมารเวชศาสตร์", risk: "NORMAL", problem: "ความสัมพันธ์", date: "05 ก.พ. 2569", status: "ติดตามผล", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=H", department: "MED_PED", year: "YEAR_4", serviceMode: "ONLINE", gender: "OTHER" },
  { id: "CASE-8780", name: "นิสิตปี 1 - อายุรศาสตร์", risk: "CRITICAL", problem: "ปัญหาสุขภาพจิต/อารมณ์", date: "04 ก.พ. 2569", status: "ฉุกเฉิน", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=I", department: "MED_MED", year: "YEAR_1", serviceMode: "ONSITE", gender: "MALE" },
  { id: "CASE-8775", name: "นิสิตปี 3 - ศัลยศาสตร์", risk: "HIGH", problem: "ความเครียดจากการเรียน", date: "03 ก.พ. 2569", status: "ปิดเคสแล้ว", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=J", department: "MED_SUR", year: "YEAR_3", serviceMode: "ONLINE", gender: "FEMALE" },
];

export function FacultyFilterView({ cases: initialCases = [] }: FacultyFilterViewProps) {
  const [filters, setFilters] = useState<FacultyFilters>({
    department: "ALL",
    yearLevel: "ALL",
    riskLevel: "ALL",
    problemCategory: "ALL",
    gender: "ALL",
    search: ""
  });

  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "risk-low-high" | "risk-high-low">("latest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const quickFilters = [
    { id: "all", label: "ทั้งหมด", icon: <Users className="w-3.5 h-3.5" /> },
    { id: "high-risk", label: "ความเสี่ยงสูง", icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-red-600 bg-red-50" },
    { id: "new-cases", label: "เคสใหม่สัปดาห์นี้", icon: <Zap className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-50" },
  ];

  // Excel Export Function
  const exportToExcel = () => {
    const exportData = filteredResults.map((item: CaseItem) => ({
      'รหัสเคส': item.id,
      'ชื่อนิสิต': item.name,
      'ภาควิชา': FILTER_DEFS.find(d => d.key === 'department')?.options?.find(o => o.value === item.department)?.label,
      'ชั้นปี': FILTER_DEFS.find(d => d.key === 'yearLevel')?.options?.find(o => o.value === item.year)?.label,
      'ปัญหา': item.problem,
      'ระดับความเสี่ยง': FILTER_DEFS.find(d => d.key === 'riskLevel')?.options?.find(o => o.value === item.risk)?.label,
      'สถานะ': item.status,
      'รูปแบบบริการ': item.serviceMode,
      'เพศ': FILTER_DEFS.find(d => d.key === 'gender')?.options?.find(o => o.value === item.gender)?.label,
      'วันที่': item.date,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "รายงานเคส");

    const fileName = `รายงานเคส_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Advanced Dynamic Filtering Logic with Sorting
  const filteredResults = useMemo(() => {
    let results = initialCases.filter((c: CaseItem) => {
      if (filters.department !== "ALL" && c.department !== filters.department) return false;
      if (filters.yearLevel !== "ALL" && c.year !== filters.yearLevel) return false;
      if (filters.riskLevel !== "ALL" && c.risk !== filters.riskLevel) return false;
      if (filters.gender !== "ALL" && c.gender !== filters.gender) return false;

      if (filters.search) {
        const s = filters.search.toLowerCase();
        return c.name.toLowerCase().includes(s) || c.id.toLowerCase().includes(s) || c.problem.toLowerCase().includes(s);
      }

      // Quick Filters
      if (activeQuickFilter === "high-risk" && !["HIGH", "CRITICAL"].includes(c.risk)) return false;

      return true;
    });

    // Reset page when filters change
    // This is handled by a useEffect or by manually resetting when setFilters is called.
    // However, since useMemo only depends on filters, we can just reset inside setter or use a watcher.
    // To be clean, we'll reset page in the FilterBar's onChange if we wrap it, 
    // but better to just do it here if possible or use a separate useEffect.
    
    // Apply Sorting
    const riskOrder: Record<string, number> = { "NORMAL": 1, "MODERATE": 2, "HIGH": 3, "CRITICAL": 4 };
    if (sortOrder === "risk-low-high") {
      results = [...results].sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);
    } else if (sortOrder === "risk-high-low") {
      results = [...results].sort((a, b) => riskOrder[b.risk] - riskOrder[a.risk]);
    }

    return results;
  }, [filters, activeQuickFilter, sortOrder]);

  // Reset page whenever results change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeQuickFilter, sortOrder]);

  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResults.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResults, currentPage]);

  // Reactive Stats Calculation
  const stats = useMemo(() => {
    const total = filteredResults.length;
    const highRisk = filteredResults.filter((r: CaseItem) => ["HIGH", "CRITICAL"].includes(r.risk)).length;
    const onsite = filteredResults.filter((r: CaseItem) => r.serviceMode === "ONSITE").length;
    const online = filteredResults.filter((r: CaseItem) => r.serviceMode === "ONLINE").length;
    
    return [
      { label: "เคสที่พบ (Filtered)", value: total.toString(), sub: `จากทั้งหมด ${initialCases.length} เคส`, icon: <Search className="text-primary" /> },
      { label: "ความเสี่ยงสูง (High Risk)", value: highRisk.toString(), sub: `${((highRisk/total || 0) * 100).toFixed(1)}% ของที่กรอง`, icon: <AlertTriangle className="text-orange-500" /> },
      { label: "บริการ Onsite", value: onsite.toString(), sub: `${((onsite/total || 0) * 100).toFixed(1)}% ของที่กรอง`, icon: <MapPin className="text-green-500" /> },
      { label: "บริการ Online", value: online.toString(), sub: `${((online/total || 0) * 100).toFixed(1)}% ของที่กรอง`, icon: <Zap className="text-blue-500" /> },
    ];
  }, [filteredResults]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Top Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">{s.label}</p>
              <h4 className="text-xl font-black text-slate-800 leading-none">{s.value}</h4>
              <p className="text-xs text-slate-400 font-bold mt-1 truncate">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 p-10 border border-slate-100 relative">
        {/* Background Accent - Clipped to card boundaries */}
        <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
              <Filter className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">ระบบคัดกรองข้อมูลอัจฉริยะ</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Advanced Multi-dimensional Data Filtering</p>
            </div>
          </div>

          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 shrink-0">
            {quickFilters.map(sf => (
              <button
                key={sf.id}
                onClick={() => setActiveQuickFilter(sf.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all
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
        </div>

        <FilterBar
          defs={FILTER_DEFS}
          value={filters}
          onChange={setFilters}
          searchKey="search"
          searchPlaceholder="ค้นหาตามชื่อนิสิต, รหัสประจำตัว, หรือรหัสเคสคำปรึกษา..."
        />
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Case Management Results</h4>
            <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full border border-primary/20">พบ {filteredResults.length} เคส</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="text-xs text-slate-600 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                เรียงตาม: {sortOrder === "latest" ? "ล่าสุด" : sortOrder === "risk-low-high" ? "เสี่ยงน้อย→มาก" : "เสี่ยงมาก→น้อย"}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 min-w-[200px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button onClick={() => { setSortOrder("latest"); setShowSortMenu(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors ${sortOrder === "latest" ? "text-primary bg-primary/5" : "text-slate-600"}`}>
                    ล่าสุด
                  </button>
                  <button onClick={() => { setSortOrder("risk-low-high"); setShowSortMenu(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors ${sortOrder === "risk-low-high" ? "text-primary bg-primary/5" : "text-slate-600"}`}>
                    เสี่ยงน้อย → มาก (ปกติ → วิกฤต)
                  </button>
                  <button onClick={() => { setSortOrder("risk-high-low"); setShowSortMenu(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors ${sortOrder === "risk-high-low" ? "text-primary bg-primary/5" : "text-slate-600"}`}>
                    เสี่ยงมาก → น้อย (วิกฤต → ปกติ)
                  </button>
                </div>
              )}
            </div>

            {/* Excel Export Button */}
            <button
              onClick={() => exportToExcel()}
              className="bg-slate-900 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg shadow-slate-900/20 hover:scale-105 transition-all flex items-center gap-2 group"
            >
              <Download className="w-3.5 h-3.5" />
              ดาวน์โหลดรายงาน .XLSX
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {paginatedResults.length > 0 ? paginatedResults.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[2rem] p-5 shadow-lg shadow-slate-200/20 border border-slate-100 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
            >
              {/* Left-side Risk Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors
                 ${item.risk === 'CRITICAL' ? 'bg-red-500' : item.risk === 'HIGH' ? 'bg-orange-500' : item.risk === 'MODERATE' ? 'bg-amber-400' : 'bg-green-500'}
              `} />

              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Avatar & ID */}
                <div className="flex items-center gap-4 shrink-0 md:w-72">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 p-0.5 border border-slate-100 group-hover:scale-110 transition-transform overflow-hidden shadow-sm relative">
                    <Image src={item.avatar} alt="Avatar" fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-primary uppercase tracking-widest leading-none">{item.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest
                             ${item.serviceMode === 'ONSITE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}
                          `}>
                        {item.serviceMode}
                      </span>
                    </div>
                    <h5 className="font-black text-slate-800 text-lg group-hover:text-primary transition-colors truncate">{item.name}</h5>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">
                      {FILTER_DEFS.find(d => d.key === 'department')?.options?.find(o => o.value === item.department)?.label}
                    </p>
                  </div>
                </div>

                <div className="h-10 w-[1px] bg-slate-100 hidden md:block" />

                {/* Problem & Risk */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                      <Brain className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ปัญหาที่พบหลัก</p>
                      <p className="text-sm font-bold text-slate-700">{item.problem}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border
                          ${item.risk === 'CRITICAL' ? 'bg-red-50 border-red-100' : item.risk === 'HIGH' ? 'bg-orange-50 border-orange-100' : item.risk === 'MODERATE' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}
                       `}>
                      <AlertTriangle className={`w-6 h-6 ${item.risk === 'CRITICAL' ? 'text-red-500' : item.risk === 'HIGH' ? 'text-orange-500' : item.risk === 'MODERATE' ? 'text-amber-500' : 'text-emerald-500'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ความเสี่ยง</p>
                      <p className={`text-sm font-black ${item.risk === 'CRITICAL' ? 'text-red-600' : item.risk === 'HIGH' ? 'text-orange-600' : item.risk === 'MODERATE' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {FILTER_DEFS.find(d => d.key === 'riskLevel')?.options?.find(o => o.value === item.risk)?.label}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status & Action */}
                <div className="shrink-0 flex items-center justify-between md:justify-end gap-6 md:w-64">
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">สถานะ</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${item.status === 'ฉุกเฉิน' ? 'bg-red-500' : 'bg-primary'}`} />
                      <span className="text-xs font-black text-slate-600">{item.status}</span>
                    </div>
                  </div>
                  <button className="bg-slate-900 group-hover:bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-slate-900/10 active:scale-95">
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            /* Improved Empty State */
            <div className="mt-12 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-20 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-slate-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] shadow-sm flex items-center justify-center mb-6 mx-auto border border-slate-100">
                  <Search className="w-10 h-10 text-slate-200" />
                </div>
                <h4 className="text-2xl font-black text-slate-600 tracking-tight">ไม่พบสถิติที่ตรงตามเงื่อนไข</h4>
                <p className="text-slate-400 font-medium max-w-sm mt-2 mx-auto">ลองเปลี่ยนรูปแบบตัวกรองหรือใช้คำค้นหาอื่น ระบบพร้อมประมวลผลข้อมูลใหม่ให้คุณทันที</p>
                <button
                  onClick={() => {
                    setFilters({ department: "ALL", yearLevel: "ALL", riskLevel: "ALL", problemCategory: "ALL", gender: "ALL", search: "" });
                    setActiveQuickFilter("all");
                  }}
                  className="mt-8 text-primary font-black text-xs uppercase tracking-widest hover:underline"
                >
                  ล้างการกรองทั้งหมด
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
              Showing <span className="text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredResults.length)}</span> of <span className="text-slate-900">{filteredResults.length}</span> cases
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-100 transition-all shadow-sm"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-100 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 mx-2">
                {[...Array(totalPages)].map((_, i) => {
                  const pg = i + 1;
                  // Show current, first, last, and neighbors
                  if (
                    pg === 1 ||
                    pg === totalPages ||
                    (pg >= currentPage - 1 && pg <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={`w-10 h-10 rounded-xl text-sm font-black transition-all
                          ${currentPage === pg
                            ? "bg-slate-950 text-white shadow-lg shadow-slate-900/20 scale-110"
                            : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100"
                          }
                        `}
                      >
                        {pg}
                      </button>
                    );
                  }
                  if (pg === currentPage - 2 || pg === currentPage + 2) {
                    return <span key={pg} className="px-1 text-slate-300">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-100 transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-100 transition-all shadow-sm"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
