import React from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { TrendingUp, AlertTriangle, Users, Heart } from "lucide-react";

export interface SummaryStat {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend?: string;
  bgColor: string;
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
  riskData: RiskItem[];
  topProblems: ProblemItem[];
  overviewTitle?: string;
}

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

export function FacultyOverview({
  summaryStats,
  sessionTrend,
  riskData,
  topProblems,
  overviewTitle = "ภาพรวม (Overview)"
}: Props) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Summary Stats Section */}
      <section>
        <div className="flex items-center gap-2.5 mb-6 px-1">
          <div className="w-1.5 h-7 bg-[rgb(var(--primary))] rounded-full shrink-0 transform translate-y-[-6px]" />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{overviewTitle}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat, index) => (
            <OverviewCard 
              key={index}
              icon={stat.icon}
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              bgColor={stat.bgColor}
            />
          ))}
        </div>
      </section>

      {/* Main Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Counseling Trends (Area Chart) */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg shadow-slate-200/30 p-6 border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                แนวโน้มการเข้ารับคำปรึกษา
              </h3>
              <p className="text-xs text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Counseling Engagement Trend</p>
            </div>
            <div className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-blue-100 uppercase tracking-wider shrink-0">Monthly Data</div>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sessionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: 'rgb(var(--primary))', strokeWidth: 2, strokeDasharray: '4 4' }}
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

        {/* Risk Distribution (Donut Chart) */}
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/30 p-6 border border-slate-100 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              ระดับความเสี่ยง
            </h3>
            <p className="text-xs text-slate-400 font-medium">สัดส่วนนักศึกษาแยกตามระดับความเสี่ยง</p>
          </div>
          <div className="h-[220px] relative flex items-center justify-center">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-3xl font-black text-slate-800 leading-none">{riskData.reduce((a, b) => a + b.value, 0)}</span>
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ราย</h4>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  innerRadius={70}
                  outerRadius={95}
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
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-3 mt-6">
             {riskData.map((item, idx) => (
               <div key={idx} className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                 <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                 <span className="text-[11px] font-bold text-slate-600 truncate">{item.name}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Top Problem Types (Modern Bar Chart) */}
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
                <div className="text-4xl font-black text-indigo-600">
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
                              <span className="text-indigo-600">{data.total} คน</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="male" 
                  stackId="a" 
                  fill="#3b82f6" 
                  radius={[4, 0, 0, 4]} 
                  barSize={18}
                />
                <Bar 
                  dataKey="female" 
                  stackId="a" 
                  fill="#ec4899" 
                  barSize={18}
                />
                <Bar 
                  dataKey="other" 
                  stackId="a" 
                  fill="#a855f7" 
                  radius={[0, 4, 4, 0]} 
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

function OverviewCard({ icon, title, value, trend, bgColor }: SummaryStat) {
  return (
    <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/30 p-6 border border-slate-50 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
      <div className={`${bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-4 ring-white shadow-sm`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      {trend && (
        <div className="absolute top-6 right-6 bg-green-50 text-green-600 text-[9px] font-black px-2 py-1 rounded-full border border-green-100 shadow-sm flex items-center gap-1">
          <TrendingUp className="w-2.5 h-2.5" />
          {trend}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
        <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
}
