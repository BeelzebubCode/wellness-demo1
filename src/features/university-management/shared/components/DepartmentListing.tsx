"use client";

import React from "react";
import { Users, GraduationCap, ArrowRight, BookOpen, AlertTriangle, Shield } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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

interface Props {
  departments: DepartmentStat[];
  onSelect: (dept: DepartmentStat) => void;
  title?: string;
  primaryColorRGB?: string; // Optional: "var(--primary)" is used by default in CSS, but this allows override if needed
}

export function DepartmentListing({ departments, onSelect, title = "รายชื่อภาควิชา (Department Statistics)" }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 mb-6 px-1">
         <div className="w-1.5 h-7 bg-[rgb(var(--primary))] rounded-full shrink-0 transform translate-y-[-4px]" />
         <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{title}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {departments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => onSelect(dept)}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-transform duration-300 border border-gray-200 hover:border-[rgb(var(--primary))] text-left h-full flex flex-col"
          >
            {/* Header Area */}
            <div className="bg-gradient-to-br from-[rgba(var(--primary),0.05)] to-[rgba(var(--accent),0.05)] p-6 border-b border-gray-100">
               <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="inline-block self-start text-[10px] font-black text-primary bg-[rgb(var(--primary)/0.08)] border border-[rgb(var(--primary)/0.15)] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      {dept.code}
                    </span>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-[rgb(var(--primary))] transition-colors line-clamp-2">
                      {dept.name}
                    </h3>
                  </div>
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-[rgb(var(--primary))] group-hover:text-white transition-colors">
                    <GraduationCap className="w-5 h-5 text-[rgb(var(--primary))] group-hover:text-white" />
                  </div>
               </div>
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
                    <span>Sessions</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dept.sessions.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-50">
                  <span className="text-gray-400 italic">Sessions per Student</span>
                  <span className="font-bold text-[rgb(var(--primary))] bg-[rgba(var(--primary),0.1)] px-2 py-0.5 rounded">
                    {dept.perStudent.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                {/* Mini Donut Chart */}
                <div className="flex items-center gap-4">
                  <DepartmentMiniChart data={dept.riskData} students={dept.students} />
                  <div className="space-y-1">
                     <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <p className="text-xs text-slate-500 font-medium">ความเสี่ยง (Risk)</p>
                     </div>
                     <div className="flex flex-wrap gap-1.5">
                        {(dept.riskData || []).filter(r => r.name.includes("High") || r.name.includes("Critical")).map((r, i) => (
                           <div key={i} className="group/risk relative flex items-center gap-1 bg-slate-50/50 px-1.5 py-0.5 rounded-md border border-slate-100">
                              <div className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: r.color }} />
                              <span className="text-[10px] text-slate-600 font-bold">{r.value}</span>
                              <span className="text-[9px] text-slate-400 font-medium">{r.name.includes("Critical") ? "C" : "H"}</span>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/risk:opacity-100 pointer-events-none transition-opacity z-10">
                                 {r.name}
                              </div>
                           </div>
                        ))}
                        {/* Total High Risk Badge */}
                        {(() => {
                           const totalHighRisk = (dept.riskData || []).filter(r => r.name.includes("High") || r.name.includes("Critical")).reduce((sum, r) => sum + r.value, 0);
                           return totalHighRisk > 0 ? (
                              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                 <Shield className="w-2.5 h-2.5 text-amber-600" />
                                 <span className="text-[9px] text-amber-700 font-black">{totalHighRisk}</span>
                              </div>
                           ) : null;
                        })()}
                     </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-[rgb(var(--primary))] group-hover:translate-x-1 transition-all">
                   View
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

function DepartmentMiniChart({ data, students }: { data?: { name: string; value: number; color: string }[], students: number }) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="relative w-16 h-16 pointer-events-auto shadow-lg shadow-slate-200/50 rounded-full" onClick={(e) => e.stopPropagation()}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={22}
            outerRadius={32}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {data?.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: activeIndex === index ? 'scale(1.15)' : 'scale(1)',
                  transformOrigin: 'center',
                  outline: 'none',
                  filter: activeIndex === index ? 'drop-shadow(0 0 6px rgba(0,0,0,0.15))' : 'none',
                  cursor: 'pointer'
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[10px] font-bold text-slate-700">{students}</span>
      </div>
    </div>
  );
}
