import React, { useEffect } from "react";
import { 
  ArrowLeft, Users, BookOpen, AlertCircle, TrendingUp, BarChart3, 
  PieChart as PieIcon, GraduationCap, Activity, Heart, Calendar, Home
} from "lucide-react";
import { DepartmentStat } from "../listing/DepartmentList_MED";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area, BarChart, Bar
} from "recharts";

interface Props {
  department: DepartmentStat;
  facultyName?: string;
  universityName?: string;
  onBack: () => void;
  onBackToList?: () => void;
}

const RISK_COLORS = {
  Critical: "#ef4444",
  High: "#f97316",
  Moderate: "#f59e0b",
  Normal: "#10b981",
};

export function DepartmentDashboard_MED({ 
  department, 
  facultyName = "คณะแพทยศาสตร์", 
  universityName = "มหาวิทยาลัยมหิดล", 
  onBack, 
  onBackToList 
}: Props) {
  // Scroll to top when department detail is opened
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Use data from department prop
  const riskData = department.riskData || [];
  const trendData = department.trendData || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
                {onBackToList && (
                    <>
                        <button
                        onClick={onBackToList}
                        className="group flex items-center gap-2 text-slate-400 hover:text-green-600 transition-all font-bold text-sm"
                        >
                        <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 group-hover:border-green-600">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        ย้อนกลับ
                        </button>
                        <div className="w-px h-4 bg-slate-300"></div>
                    </>
                )}

                <button
                onClick={onBack}
                className="group flex items-center gap-2 text-slate-400 hover:text-green-600 transition-all font-bold text-sm"
                >
                <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 group-hover:border-green-600">
                    <Home className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </div>
                กลับหน้าหลัก
                </button>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-green-600">
                  <GraduationCap className="w-8 h-8" />
               </div>
               <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-2 whitespace-nowrap">
                    <div className="text-4xl font-black text-slate-900 tracking-tight">{department.name}</div>
                    <span className="text-sm font-black text-green-600 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-lg uppercase tracking-wider shrink-0 transform translate-y-[4px]">{department.code}</span>
                  </div>
                  <p className="text-slate-500 font-bold text-lg leading-none">{facultyName} {universityName}</p>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 group">
             <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse ring-4 ring-green-50" />
             <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Live Content Delivery</span>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Users className="w-5 h-5 text-green-500" />} 
            title="จำนวนนิสิตทั้งหมด" 
            value={department.students.toLocaleString()} 
            label="คน (Students)"
            bgColor="bg-green-50"
            ringColor="ring-green-100/50"
          />
          <StatCard 
            icon={<BookOpen className="w-5 h-5 text-emerald-500" />} 
            title="จำนวนการเข้าพบ" 
            value={department.sessions.toLocaleString()} 
            label="ครั้ง (Sessions)"
            bgColor="bg-emerald-50"
            ringColor="ring-emerald-100/50"
          />
          <StatCard 
            icon={<Activity className="w-5 h-5 text-teal-500" />} 
            title="ความถี่เฉลี่ย" 
            value={department.perStudent.toFixed(2)} 
            label="ครั้ง/คน (Avg.)"
            bgColor="bg-teal-50"
            ringColor="ring-teal-100/50"
          />
          <StatCard 
            icon={<AlertCircle className="w-5 h-5 text-rose-500" />} 
            title="แจ้งเตือนที่ต้องดูแล" 
            value="3" 
            label="รายการ (Alerts)"
            bgColor="bg-rose-50"
            ringColor="ring-rose-100/50"
          />
        </div>

        {/* Main Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Risk Distribution (Donut) */}
          <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/30 p-6 border border-slate-100 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-500" />
                สถานะความเสี่ยงของนิสิต
              </h3>
              <p className="text-xs text-slate-400 font-medium">Risk Status Distribution</p>
            </div>
            
            <div className="h-[240px] relative flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* Total Count - Fades OUT when activeIndex is not null */}
                <div className={`flex flex-col items-center justify-center transition-all duration-300 absolute ${activeIndex !== null ? 'opacity-0 scale-90 translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
                   <span className="text-3xl font-black text-slate-800 leading-none">{riskData.reduce((a, b) => a + b.value, 0)}</span>
                   <p className="text-xs font-bold text-slate-400 mt-1">ราย</p>
                </div>

                {/* Active Segment Value - Fades IN when activeIndex is NOT null */}
                <div className={`flex flex-col items-center justify-center transition-all duration-300 absolute px-6 text-center ${activeIndex === null ? 'opacity-0 scale-90 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
                   {activeIndex !== null && riskData[activeIndex] && (
                      <>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 leading-tight line-clamp-1 max-w-[120px]">
                            {riskData[activeIndex].name}
                         </span>
                         <span className="text-3xl font-black text-slate-800 leading-none tabular-nums">
                            {riskData[activeIndex].value}
                         </span>
                         <p className="text-xs font-bold text-slate-400 mt-1">ราย</p>
                      </>
                   )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={riskData}
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1000}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    stroke="none"
                  >
                    {riskData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke="#fff"
                        strokeWidth={activeIndex === index ? 4 : 2}
                        style={{ 
                          filter: activeIndex === index ? `drop-shadow(0 0 10px ${entry.color}66)` : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          transform: activeIndex === index ? 'scale(1.08)' : 'scale(1)',
                          transformOrigin: 'center',
                          outline: 'none'
                        }}
                      />
                    ))}
                  </Pie>

                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
               {riskData.map((item, idx) => (
                 <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                   <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                   <span className="text-xs font-bold text-slate-600 truncate">{item.name}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Visit Trends (Area Chart) */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg shadow-slate-200/30 p-8 border border-slate-100 flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="space-y-0.5">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  แนวโน้มการเข้ารับคำปรึกษา
                </h3>
                <p className="text-xs text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Counseling Engagement Trend (Last 6 Months)</p>
              </div>
              <div className="px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600 text-xs font-black flex items-center gap-2 shrink-0">
                <Calendar className="w-3.5 h-3.5" />
                Updated Today
              </div>
            </div>
            
            <div className="h-[280px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSessionsDeptMU" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 600 }}
                    dy={12}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 13 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#10b981" 
                    strokeWidth={5}
                    fillOpacity={1} 
                    fill="url(#colorSessionsDeptMU)" 
                    dot={{ r: 6, fill: "#10b981", strokeWidth: 3, stroke: "#fff" }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Problem Statistics by Category (Horizontal Bar Chart) */}
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/30 p-8 border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex w-full items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  ประเภทปัญหาที่พบ
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  แยกตามเพศ — หมวดหมู่ปัญหาที่พบ
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-600">
                  {(department.topProblems || []).reduce((sum, p) => sum + p.total, 0)}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">รายทั้งหมด</div>
              </div>
            </div>
          </div>
          
            {/* Custom Legend */}
            <div className="flex justify-end gap-4 mb-6 mt-2 px-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                <span className="text-[10px] font-bold text-slate-500">ชาย</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ec4899]" />
                <span className="text-[10px] font-bold text-slate-500">หญิง</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#a855f7]" />
                <span className="text-[10px] font-bold text-slate-500">อื่นๆ</span>
              </div>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={department.topProblems} 
                  layout="vertical" 
                  margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
                  barGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }}
                    width={110}
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
                              <div className="flex items-center justify-between gap-6 text-xs font-bold">
                                <span className="text-blue-500">ชาย</span>
                                <span className="text-slate-700">{data.male} คน</span>
                              </div>
                              <div className="flex items-center justify-between gap-6 text-xs font-bold">
                                <span className="text-pink-500">หญิง</span>
                                <span className="text-slate-700">{data.female} คน</span>
                              </div>
                              <div className="flex items-center justify-between gap-6 text-xs font-bold">
                                <span className="text-purple-500">อื่นๆ</span>
                                <span className="text-slate-700">{data.other} คน</span>
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-black">
                                <span className="text-slate-400">รวม</span>
                                <span className="text-emerald-600">{data.total} คน</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="male" stackId="a" fill="#3b82f6" radius={[2, 0, 0, 2]} barSize={14} />
                  <Bar dataKey="female" stackId="a" fill="#ec4899" barSize={14} />
                  <Bar dataKey="other" stackId="a" fill="#a855f7" radius={[0, 2, 2, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, label, bgColor, ringColor }: { 
  icon: React.ReactNode; 
  title: string; 
  value: string; 
  label: string;
  bgColor: string;
  ringColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow shadow-slate-200/30 p-5 border border-slate-50 group hover:scale-[1.03] transition-all duration-500 overflow-hidden relative">
      <div className={`${bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-4 ${ringColor} transition-transform group-hover:rotate-6`}>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
          <span className="text-xs font-bold text-slate-400">{label}</span>
        </div>
      </div>
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <TrendingUp className="w-10 h-10 text-slate-200" />
      </div>
    </div>
  );
}
