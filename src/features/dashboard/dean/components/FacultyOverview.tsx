import React from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { TrendingUp, AlertTriangle, Users, Heart, ArrowRight, Activity, Building2, Search, Zap, ShieldCheck, Calendar, ChevronDown, GraduationCap, Brain, AlertCircle, BookOpen } from "lucide-react";
import { FacultyDateRangePicker } from "./FacultyDateRangePicker";
import { FacultyAdvancedFilter, FacultyFilters } from "./FacultyAdvancedFilter";

export interface SummaryStat {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend?: string;
  bgColor?: string; // Standard BG color
  borderClass?: string; // Reference image uses left borders
  footer?: React.ReactNode;
  valueColor?: string;
}

export interface SessionTrendItem {
  name: string;
  sessions: number;
}

export interface RiskItem {
  name: string;
  value: number;
  color: string;
}

export interface ProblemItem {
  name: string;
  male: number;
  female: number;
  other: number;
  total: number;
}

interface Props {
  summaryStats: SummaryStat[];
  sessionTrend: SessionTrendItem[];
  problemDistribution: RiskItem[];
  topProblems: ProblemItem[];
  strategicAnalysis?: {
    riskGroup: { name: string; count: number; sub: string };
    topProblem: { name: string; count: number; sub: string };
  };
  departmentComparison?: {
    name: string;
    code: string;
    students: number;
    sessions: number;
    accessRate: number;
  }[];
  overviewTitle?: string;
  facultyName: string;
  universityName: string;
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
}

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

export function FacultyOverview({
  summaryStats,
  sessionTrend,
  problemDistribution,
  topProblems,
  strategicAnalysis,
  departmentComparison,
  overviewTitle = "ภาพรวม",
  facultyName,
  universityName,
  startDate,
  endDate,
  onDateRangeChange
}: Props) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Advanced Filter State
  const [filters, setFilters] = React.useState<FacultyFilters>({
    department: "ALL",
    yearLevel: "ALL",
    riskLevel: "ALL",
    problemCategory: "ALL",
    gender: "ALL",
    search: ""
  });
  const [activeQuickFilter, setActiveQuickFilter] = React.useState("all");

  // Derive gender totals from topProblems
  const genderTotals = React.useMemo(() => {
    return topProblems.reduce((acc, p) => ({
      male: acc.male + p.male,
      female: acc.female + p.female,
      other: acc.other + p.other,
      total: acc.total + p.total
    }), { male: 0, female: 0, other: 0, total: 0 });
  }, [topProblems]);

  const malePercent = genderTotals.total > 0 ? Math.round((genderTotals.male / genderTotals.total) * 100) : 0;
  const femalePercent = genderTotals.total > 0 ? Math.round((genderTotals.female / genderTotals.total) * 100) : 0;
  const otherPercent = genderTotals.total > 0 ? Math.max(0, 100 - malePercent - femalePercent) : 0;

  // Derive department highlights
  const depts = departmentComparison || [];
  const maxSessionsDept = depts.length > 0 ? [...depts].sort((a, b) => b.sessions - a.sessions)[0] : null;
  const maxAccessRateDept = depts.length > 0 ? [...depts].sort((a, b) => b.accessRate - a.accessRate)[0] : null;
  const minAccessRateDept = depts.length > 0 ? [...depts].sort((a, b) => a.accessRate - b.accessRate)[0] : null;

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* Advanced Filter Section */}
      <FacultyAdvancedFilter 
        filters={filters}
        onFilterChange={setFilters}
        activeQuickFilter={activeQuickFilter}
        onQuickFilterChange={setActiveQuickFilter}
      />

      {/* Summary Stats Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <h3 className="text-xl font-black text-slate-600 uppercase tracking-widest">{overviewTitle}</h3>
        </div>
        
        <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 border border-slate-100 overflow-hidden">
          <div className="flex divide-x divide-slate-100">
            {summaryStats.map((stat, index) => (
              <div 
                key={index} 
                className="flex-1 p-6 min-w-0 text-center"
              >
                <div className="flex flex-col items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl bg-slate-50 text-slate-600 flex-shrink-0`}>
                    {stat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 truncate">
                      {stat.title}
                    </p>
                    <h3 className={`text-4xl font-black tracking-tight ${stat.valueColor || 'text-slate-800'} tabular-nums`}>
                      {stat.value}
                    </h3>
                  </div>
                </div>
                {stat.footer && (
                  <div className="mt-3 pt-3 border-t border-slate-50">
                    {stat.footer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Analytics Section (Redesigned) */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1 pt-4">
          <h3 className="text-xl font-black text-slate-600 uppercase tracking-widest">การวิเคราะห์</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Counseling Trends (Area Chart) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 p-8 border border-slate-100 flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">กราฟสถิติการเข้ารับการปรึกษา</h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Weekly Case Analytics</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-4xl font-black text-primary tracking-tighter tabular-nums">
                  {sessionTrend.reduce((sum, item) => sum + item.sessions, 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">จำนวนครั้งทั้งหมด</div>
              </div>
            </div>
            <div className="flex-grow min-h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: '800' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="rgb(var(--primary))" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorSessions)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Problem Donut (ปัญหาที่พบบ่อย) */}
          <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 p-8 border border-slate-100 flex flex-col items-center">
            <div className="w-full text-left mb-6">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">ปัญหาที่พบบ่อย</h3>
               <p className="text-xs text-slate-400 font-bold leading-relaxed">5 อันดับปัญหาหลักที่นิสิตมาขอความช่วยเหลือ</p>
            </div>
            
            <div className="relative w-full aspect-square max-w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip cursor={false} content={<></>} />
                  <Pie
                    data={problemDistribution}
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    stroke="none"
                    animationBegin={0}
                    animationDuration={1200}
                  >
                    {problemDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                        className="transition-all duration-300 outline-none cursor-pointer"
                        style={{
                          transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: 'center'
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* Total Count - Fades OUT when activeIndex is not null */}
                <div className={`flex flex-col items-center transition-all duration-500 absolute ${activeIndex !== null ? 'opacity-0 scale-90 translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
                  <span className="text-3xl font-black text-slate-800 tabular-nums leading-none">
                    {problemDistribution.reduce((sum, item) => sum + item.value, 0)}
                  </span>
                  <span className="text-sm font-bold text-slate-400 mt-1">ราย</span>
                </div>

                {/* Segment Info - Fades IN when activeIndex is NOT null */}
                <div className={`flex flex-col items-center transition-all duration-500 absolute px-6 text-center ${activeIndex === null ? 'opacity-0 scale-90 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
                  {activeIndex !== null && (
                    <>
                      <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-tight">
                        {problemDistribution[activeIndex].name}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-800 tabular-nums">
                          {problemDistribution[activeIndex].value}
                        </span>
                        <span className="text-xs font-bold text-slate-400">ราย</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full mt-10 space-y-4">
               {problemDistribution.map((item, index) => (
                 <div key={index} className="flex items-center justify-between group cursor-default">
                   <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: item.color }} />
                     <span className="text-sm font-bold text-slate-600 transition-colors group-hover:text-slate-900">{item.name}</span>
                   </div>
                   <span className="text-sm font-black text-slate-800">{item.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top Problem Types (Modern Bar Chart) */}
      <section>
        <div className="lg:col-span-3 bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 p-8 border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex w-full items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  ประเภทปัญหาที่พบ
                </h3>
                <p className="text-sm text-slate-400 font-bold">
                  แยกตามเพศ — Top 8 หมวดหมู่
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-primary">
                  {topProblems.reduce((sum, p) => sum + p.total, 0)}
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">รายทั้งหมด</div>
              </div>
            </div>
          </div>
          
          {/* Custom Legend */}
          <div className="flex justify-end gap-6 mb-8 mt-4 px-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#3b82f6]" />
              <span className="text-xs font-bold text-slate-500">ชาย</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#ec4899]" />
              <span className="text-xs font-bold text-slate-500">หญิง</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#a855f7]" />
              <span className="text-xs font-bold text-slate-500">อื่นๆ/ไม่ระบุ</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={topProblems} 
              layout="vertical" 
              margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
              barGap={0}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 800 }}
                width={150}
                interval={0}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc', radius: 4 }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 rounded-2xl shadow-xl border-0">
                        <p className="text-sm font-black text-slate-800 mb-3">{label}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-8 text-xs font-bold">
                            <div className="flex items-center gap-2 text-blue-500">
                              <div className="w-2 h-2 rounded-full bg-blue-500" /> ชาย
                            </div>
                            <span className="text-slate-700">{data.male} คน</span>
                          </div>
                          <div className="flex items-center justify-between gap-8 text-xs font-bold">
                            <div className="flex items-center gap-2 text-pink-500">
                              <div className="w-2 h-2 rounded-full bg-pink-500" /> หญิง
                            </div>
                            <span className="text-slate-700">{data.female} คน</span>
                          </div>
                          <div className="flex items-center justify-between gap-8 text-xs font-bold">
                            <div className="flex items-center gap-2 text-purple-500">
                              <div className="w-2 h-2 rounded-full bg-purple-500" /> อื่นๆ
                            </div>
                            <span className="text-slate-700">{data.other} คน</span>
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-black">
                            <span className="text-slate-400">รวมทั้งหมด</span>
                            <span className="text-primary">{data.total} คน</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="male" stackId="a" fill="#3b82f6" radius={[4, 0, 0, 4]} barSize={18} />
              <Bar dataKey="female" stackId="a" fill="#ec4899" barSize={18} />
              <Bar dataKey="other" stackId="a" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Department Highlights Section */}
      <section>
        <div className="space-y-1 mb-8 px-1 pt-4">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">ภาพรวมภาควิชา</h3>
          <p className="text-sm text-slate-400 font-bold">เปรียบเทียบสถิติระหว่างภาควิชาในคณะ</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HighlightCard 
            icon={<BookOpen />}
            title="ภาควิชาที่ใช้บริการมากที่สุด"
            dept={maxSessionsDept?.name || "ไม่ระบุ"}
            value={`${maxSessionsDept?.sessions || 0} ครั้ง`}
            note={maxSessionsDept ? `${((maxSessionsDept.sessions / (genderTotals.total || 1)) * 100).toFixed(1)}%` : "0%"}
            themeColor="text-primary"
            borderColor="border-primary/20"
            bgColor="bg-primary/5"
          />
          <HighlightCard 
            icon={<AlertCircle />}
            title="อัตราเข้าถึงสูงสุด"
            dept={maxAccessRateDept?.name || "ไม่ระบุ"}
            value={`${maxAccessRateDept?.accessRate.toFixed(1) || 0}%`}
            note="อาจต้องเพิ่ม capacity"
            themeColor="text-primary"
            borderColor="border-primary/20"
            bgColor="bg-primary/5"
          />
          <HighlightCard 
            icon={<TrendingUp />}
            title="อัตราเข้าถึงต่ำสุด"
            dept={minAccessRateDept?.name || "ไม่ระบุ"}
            value={`${minAccessRateDept?.accessRate.toFixed(1) || 0}%`}
            note="อาจต้องเพิ่มการเข้าถึง"
            themeColor="text-primary"
            borderColor="border-primary/20"
            bgColor="bg-primary/5"
          />
        </div>
      </section>

      {/* Comparison Table Section */}
      <section>
        <div className="flex items-center justify-between mb-6 px-1 pt-4">
          <h3 className="text-xl font-black text-slate-600 uppercase tracking-widest">เปรียบเทียบแยกรายภาควิชา</h3>
          <div className="flex items-center gap-2 text-xs font-black text-slate-400">
             <Users className="w-3 h-3" />
             {depts.length} ภาควิชา — {depts.reduce((sum: number, d) => sum + d.students, 0).toLocaleString()} รายทั้งหมด
          </div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">#</th>
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">ภาควิชา</th>
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">จำนวนนิสิต</th>
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">จำนวนครั้งที่ใช้บริการ</th>
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">อัตราการเข้าถึง (ACCESS RATE)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {depts.map((dept, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800">{dept.name}</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{dept.code}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm font-bold text-slate-400 text-center">{dept.students.toLocaleString()}</td>
                  <td className="px-8 py-4 text-sm font-black text-primary text-center">{dept.sessions.toLocaleString()}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-primary rounded-full transition-all duration-1000" 
                           style={{ width: `${Math.min(100, dept.accessRate)}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-800 shrink-0 w-10 text-right">{dept.accessRate.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Strategic Summary Section */}
      <section className="pb-12">
        <div className="space-y-1 mb-8 px-1 pt-4">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">สรุปประเด็นเชิงกลยุทธ์</h3>
          <p className="text-sm text-slate-400 font-bold">ข้อมูลเชิงลึกเพื่อการวางแผนดูแลนิสิต</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Risk Group (Primary Gradient) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary rounded-[2rem] p-8 text-white flex flex-col justify-between min-h-[260px] shadow-xl shadow-primary/20 group">
             <div className="relative z-10 flex items-center gap-2.5 mb-2">
                <GraduationCap className="w-5 h-5 opacity-80" />
                <span className="text-sm font-black uppercase tracking-wider opacity-80">กลุ่มเสี่ยงสูงสุด</span>
             </div>
             <div className="relative z-10">
                <div className="text-3xl font-black mb-2 tracking-tighter truncate">{strategicAnalysis?.riskGroup.name || "N/A"}</div>
                <p className="text-sm font-bold text-white/90">{strategicAnalysis?.riskGroup.sub || "จำนวน 0 คน"}</p>
             </div>
             <div className="relative z-10 mt-6">
                <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest backdrop-blur-md">สถิติกลุ่มเปราะบาง</span>
             </div>
             {/* Background Watermark Icon */}
             <GraduationCap className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 -rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          </div>

          {/* Card 2: Main Problem (Primary Darker Gradient) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary rounded-[2rem] p-8 text-white flex flex-col justify-between min-h-[260px] shadow-xl shadow-primary/20 group">
             <div className="relative z-10 flex items-center gap-2.5 mb-2">
                <Brain className="w-5 h-5 opacity-80" />
                <span className="text-sm font-black uppercase tracking-wider opacity-80">ปัญหาที่พบมากที่สุด</span>
             </div>
             <div className="relative z-10">
                <div className="text-xl font-black mb-2 leading-tight tracking-tight line-clamp-2">{strategicAnalysis?.topProblem.name || "สุขภาพจิต/อารมณ์"}</div>
                <p className="text-sm font-bold text-white/90">{strategicAnalysis?.topProblem.sub || "จำนวน 0 เคส"}</p>
             </div>
             <div className="relative z-10 mt-6">
                <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest backdrop-blur-md">ความกังวลสูงสุด</span>
             </div>
             {/* Background Watermark Icon */}
             <Brain className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 -rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          </div>

          {/* Card 3: Gender Distribution (Dark Slate) */}
          <div className="bg-[#334155] rounded-[2rem] p-8 text-white flex flex-col justify-between min-h-[260px] shadow-xl shadow-slate-900/20">
             <div className="flex items-center gap-2.5 mb-6">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                   <Users className="w-4 h-4 text-white opacity-80" />
                </div>
                <span className="text-sm font-black uppercase tracking-wider opacity-80">สัดส่วนผู้ขอรับคำปรึกษา</span>
             </div>
             
             <div className="space-y-5">
                {/* Male */}
                <div className="space-y-2">
                   <div className="flex justify-between items-end">
                       <span className="text-xs font-bold text-white/60 uppercase tracking-widest">ชาย</span>
                      <span className="text-sm font-black text-white">{malePercent}%</span>
                   </div>
                   <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: `${malePercent}%` }} />
                   </div>
                </div>
                {/* Female */}
                <div className="space-y-2">
                   <div className="flex justify-between items-end">
                       <span className="text-xs font-bold text-white/60 uppercase tracking-widest">หญิง</span>
                      <span className="text-sm font-black text-white">{femalePercent}%</span>
                   </div>
                   <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-400" style={{ width: `${femalePercent}%` }} />
                   </div>
                </div>
                {/* Other */}
                <div className="space-y-2">
                   <div className="flex justify-between items-end">
                       <span className="text-xs font-bold text-white/60 uppercase tracking-widest">อื่นๆ</span>
                      <span className="text-sm font-black text-white">{otherPercent}%</span>
                   </div>
                   <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400" style={{ width: `${otherPercent}%` }} />
                   </div>
                </div>
             </div>

             <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-5">
                 <p className="text-xs font-black text-white/60 uppercase tracking-widest">รวม {genderTotals.total.toLocaleString()} ราย</p>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                       <span className="text-[11px] font-black text-white/60">ช</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                       <span className="text-[11px] font-black text-white/60">ญ</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                       <span className="text-[11px] font-black text-white/60">อ</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function HighlightCard({ 
  icon, 
  title, 
  dept, 
  value, 
  note,
  themeColor,
  borderColor,
  bgColor 
}: { 
  icon: React.ReactNode, 
  title: string, 
  dept: string, 
  value: string, 
  note?: string,
  themeColor: string,
  borderColor: string,
  bgColor: string 
}) {
  return (
    <div className={`p-8 rounded-[2rem] ${bgColor} border ${borderColor} flex flex-col gap-6 shadow-lg shadow-slate-200/10 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden backdrop-blur-sm`}>
      {/* Decorative gradient blur */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${themeColor.replace('text-', 'bg-')} opacity-10 blur-3xl group-hover:scale-150 transition-all duration-700`} />
      
      <div className="flex items-center gap-3 relative z-10">
        <div className="p-2.5 bg-white rounded-xl shadow-sm ring-4 ring-white flex items-center justify-center transition-transform group-hover:rotate-6">
           {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: `w-5 h-5 ${themeColor}` }) : null}
        </div>
        <span className={`text-[13px] font-black uppercase tracking-widest ${themeColor}`}>{title}</span>
      </div>
      
      <div className="relative z-10">
        <h4 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{dept}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-black text-slate-600">{value}</span>
          {note && <span className="text-xs font-bold text-slate-400">({note})</span>}
        </div>
      </div>
    </div>
  );
}

const DEPARTMENT_COMPARISON = [
  { name: "อายุรศาสตร์", code: "MED_MED", students: 584, sessions: 84, accessRate: 14.4 },
  { name: "เวชศาสตร์ครอบครัว", code: "MED_FML", students: 382, sessions: 68, accessRate: 17.8 },
  { name: "โรคผิวหนัง", code: "MED_DER", students: 326, sessions: 54, accessRate: 16.6 },
  { name: "กุมารเวชศาสตร์", code: "MED_PED", students: 507, sessions: 52, accessRate: 10.3 },
  { name: "จิตเวชศาสตร์", code: "MED_PSY", students: 315, sessions: 51, accessRate: 16.2 },
  { name: "สูติศาสตร์-นรีเวชวิทยา", code: "MED_OBG", students: 364, sessions: 27, accessRate: 7.4 },
  { name: "พยาธิวิทยา", code: "MED_PTH", students: 286, sessions: 23, accessRate: 8.0 },
  { name: "ศัลยศาสตร์", code: "MED_SUR", students: 355, sessions: 21, accessRate: 5.9 },
];

function OverviewCard({ icon, title, value, trend, borderClass, footer, valueColor }: SummaryStat) {
  return (
    <div className={`bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 p-6 border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 flex flex-col justify-between border-l-8 ${borderClass}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center ring-4 ring-white shadow-sm transition-transform group-hover:rotate-6">
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5 text-slate-600' }) : null}
        </div>
        <div className="flex-1 text-right">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
            {title}
          </p>
        </div>
      </div>
      
      <div>
        <h3 className={`text-3xl font-black tracking-tight ${valueColor || 'text-slate-800'}`}>
          {value}
        </h3>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50/80">
        {footer || (trend && (
          <div className="bg-slate-50 text-slate-600 text-[10px] font-black px-2 py-1 rounded-full border border-slate-100 flex items-center gap-1 group-hover:bg-slate-100 transition-colors inline-flex">
            {trend}
          </div>
        ))}
      </div>
    </div>
  );
}
