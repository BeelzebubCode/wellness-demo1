'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  CalendarDays,
  Filter,
  ClipboardList,
  CalendarClock,
  Clock3,
  PlayCircle,
  CheckCircle2,
  MoreHorizontal,
  Loader2,
  ChevronDown,
  Info
} from 'lucide-react';

// ====================================================================
// UI COMPONENTS (Compact & Premium Style - สไตล์เดิมที่คุณชอบ)
// ====================================================================

const Card = ({ className, children, noPadding = false }: { className?: string, children: React.ReactNode, noPadding?: boolean }) => (
  <div className={`relative bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl ${noPadding ? '' : 'p-4'} ${className || ''}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'default', className, onClick, disabled }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-95";

  const variants: any = {
    primary: "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-0.5",
    outline: "border border-slate-200 bg-white/50 text-slate-600 hover:border-teal-500 hover:text-teal-600 hover:bg-white",
    ghost: "hover:bg-slate-100 text-slate-500",
  };

  const sizes: any = {
    default: "h-8 px-4 text-xs", 
    sm: "h-7 px-3 text-[10px]", 
    icon: "h-8 w-8 p-0"
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className || ''}`}
    >
      {children}
    </button>
  );
};

// Formatter
const formatThaiDate = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};
const toISODateString = (date: Date) => date.toISOString().split('T')[0];

// ====================================================================
// MOCK DATA
// ====================================================================

type BookingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface Booking {
  id: string;
  timeRange: string;
  status: BookingStatus;
  userName: string;
  category: string;
  detail: string;
}

export default function ConsultantMyJobsPage() {
  // --- State ---
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<Booking[]>([]);

  // Stats State
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });

  const selectedDateStr = useMemo(() => toISODateString(selectedDate), [selectedDate]);

  // --- Logic ---
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const hasJobs = true;
      if (hasJobs) {
        setJobs([
        //   { id: '1', timeRange: '09:00 - 10:00', status: 'COMPLETED', userName: 'น้องเอ (นามสมมติ)', category: 'การเรียน', detail: 'มีความกังวลเรื่องการสอบเข้ามหาวิทยาลัย นอนไม่หลับ' },
        //   { id: '2', timeRange: '10:30 - 11:30', status: 'IN_PROGRESS', userName: 'น้องบี', category: 'ครอบครัว', detail: 'ทะเลาะกับที่บ้านเรื่องเลือกสายการเรียน' },
        //   { id: '3', timeRange: '13:00 - 14:00', status: 'PENDING', userName: 'น้องซี', category: 'ความรัก', detail: '-' },
        ]);
        setStats({ today: 3, pending: 1, inProgress: 1, completed: 1 });
      } else {
        setJobs([]);
        setStats({ today: 0, pending: 0, inProgress: 0, completed: 0 });
      }
      setIsLoading(false);
    }, 600);
  }, [selectedDateStr, statusFilter]);

  const handleChangeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) setSelectedDate(new Date(e.target.value));
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING': return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">รอคิว</span>;
      case 'IN_PROGRESS': return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">กำลังคุย</span>;
      case 'COMPLETED': return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">เสร็จสิ้น</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 relative overflow-hidden selection:bg-teal-200 selection:text-teal-900">
      
      {/* Decorative Globs (แบบเดิม) */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-teal-100/30 blur-[100px] pointer-events-none z-0 mix-blend-multiply" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-100/30 blur-[80px] pointer-events-none z-0 mix-blend-multiply" />

        <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 space-y-6">

          {/* ================= 1. HEADER & CONTROLS ================= */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-slate-200/60">
            
            {/* Title Section */}
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                <div className="w-6 h-6 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>

              {/* Text */}
              <div className="flex flex-col space-y-[4px]">
                <p className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
                  งานของฉัน
                </p>
                <p className="text-sm font-medium text-slate-500 leading-none">
                  ดูคิวที่รับผิดชอบ และจัดการสถานะการให้คำปรึกษา
                </p>
              </div>
            </div>
            {/* Controls Section (แก้ไขเฉพาะตรงนี้: text-xs -> text-sm และปรับ padding ให้พอดี) */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-teal-500 transition-colors pointer-events-none">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={handleChangeDate}
                  className="pl-8 pr-3 h-9 w-full sm:w-[180px] bg-white border border-slate-200 hover:border-teal-400 rounded-lg text-sm font-semibold text-slate-700 shadow-sm"
                />
              </div>

              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-teal-500 transition-colors pointer-events-none">
                  <Filter className="w-4 h-4" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 h-9 w-full sm:w-[160px] bg-white border border-slate-200 hover:border-teal-400 rounded-lg text-sm font-semibold text-slate-700 shadow-sm focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="ALL">ทุกสถานะ</option>
                  <option value="PENDING">รอคิว</option>
                  <option value="IN_PROGRESS">กำลังคุย</option>
                  <option value="COMPLETED">เสร็จสิ้น</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

            </div>
          </div>

          {/* ================= 2. STATS WIDGETS ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatWidget
              title="นัดหมายวันนี้"
              value={stats.today}
              icon={CalendarClock}
              theme="teal"
            />
            <StatWidget
              title="รอดำเนินการ"
              value={stats.pending}
              icon={Clock3}
              theme="amber"
            />
            <StatWidget
              title="กำลังดำเนินการ"
              value={stats.inProgress}
              icon={PlayCircle}
              theme="indigo"
            />
            <StatWidget
              title="ปิดเคสแล้ว"
              value={stats.completed}
              icon={CheckCircle2}
              theme="emerald"
            />
          </div>

          {/* ================= 3. CONTENT GRID ================= */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

            {/* Left Column: List */}
            <div className="xl:col-span-2 flex flex-col gap-4">
              <Card className="min-h-[500px] flex flex-col overflow-hidden shadow-md" noPadding>
                
                {/* Header inside Card */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white/60 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-teal-500 rounded-full"></span>

                    <p className="text-sm font-bold text-slate-800 leading-none">
                      รายการนัดหมาย
                    </p>
                  </div>

                  <div className="px-2.5  py-0.5 bg-white rounded-md text-slate-500 text-[12px] font-semibold border border-slate-100 shadow-sm leading-none">
                    {formatThaiDate(selectedDate)}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 bg-slate-50/50">
                  {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-2" />
                      <span className="text-xs font-medium">กำลังโหลด...</span>
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-16">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-50">
                        <ClipboardList className="w-8 h-8 text-slate-300" />
                      </div>
                      <div className="text-center">
                         <p className="text-sm font-bold text-slate-600">ว่างจังเลย!</p>
                         <p className="text-xs text-slate-400 mt-1">ยังไม่มีงานที่ต้องดำเนินการ</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobs.map((job) => (
                        <JobItem key={job.id} job={job} getStatusBadge={getStatusBadge} />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column: Widgets */}
            <div className="space-y-4 xl:sticky xl:top-4">

              {/* Widget 1: Info */}
              <div className="relative overflow-hidden rounded-xl p-[1px] bg-gradient-to-br from-teal-200 to-slate-200 shadow-sm">
                 <div className="bg-white/95 backdrop-blur-xl rounded-[11px] p-4 relative">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600">
                          <Info className="w-4 h-4" />
                       </div>
                       <h3 className="font-bold text-slate-800 text-sm">หมายเหตุการใช้งาน</h3>
                    </div>

                    <ul className="space-y-3">
                      <InstructionItem 
                        text={<span>งานที่ยังไม่มีผู้รับผิดชอบจะแสดงปุ่ม <span className="text-teal-600 font-bold bg-teal-50 px-1 rounded">"รับเคสนี้"</span> เพื่อให้คุณรับมาดูแลเอง</span>}
                      />
                      <InstructionItem 
                        text={<span>เมื่อเริ่มการให้คำปรึกษา ให้กด <span className="text-indigo-600 font-bold bg-indigo-50 px-1 rounded">"เริ่มให้คำปรึกษา"</span> เปลี่ยนสถานะเป็น <span className="text-indigo-600 font-bold">กำลังดำเนินการ</span></span>}
                      />
                      <InstructionItem 
                        text={<span>หลังให้คำปรึกษาเสร็จสิ้น ให้กด <span className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded">"ปิดเคส"</span> เพื่อเก็บในสถิติ</span>}
                      />
                    </ul>
                 </div>
              </div>

              {/* Widget 2: Summary */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 text-sm">สรุปงานวันนี้</h3>
                  <span className="text-[10px] font-bold tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase">Update</span>
                </div>

                <div className="space-y-2.5">
                  <SummaryRow label="จำนวนเคสทั้งหมด" value={stats.today} isTotal />
                  <div className="border-t border-slate-100 border-dashed my-1"></div>
                  <SummaryRow label="รอดำเนินการ" value={stats.pending} color="bg-amber-100 text-amber-700" />
                  <SummaryRow label="กำลังดำเนินการ" value={stats.inProgress} color="bg-indigo-100 text-indigo-700" />
                  <SummaryRow label="เสร็จสิ้น" value={stats.completed} color="bg-emerald-100 text-emerald-700" />
                </div>
              </Card>

            </div>
          </div>

        </main>
      </div>
  );
}

// ====================================================================
// SUB-COMPONENTS
// ====================================================================

const StatWidget = ({ title, value, icon: Icon, theme }: any) => {
  const themeStyles: any = {
    teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  };
  
  const t = themeStyles[theme] || themeStyles.teal;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
      <div className="flex items-start justify-between">
        <div className="relative z-10">
           <p className="text-xs font-semibold text-slate-400 mb-0.5">{title}</p>
           <h4 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
        </div>
        <div className={`p-2.5 rounded-lg ${t.bg} ${t.text} ring-1 ring-inset ${t.border}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const JobItem = ({ job, getStatusBadge }: any) => (
  <div className="group relative p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-teal-200 transition-all duration-300">
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      
      {/* Time Box */}
      <div className="flex-shrink-0 flex md:flex-col items-center justify-center gap-2 md:gap-0 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 min-w-[90px] text-center">
         <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">เวลา</span>
         <span className="text-slate-800 font-bold text-xs whitespace-nowrap">{job.timeRange}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
           <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-bold border border-slate-200 uppercase tracking-wide">
             {job.category}
           </span>
        </div>
        <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-teal-700 transition-colors">
          {job.userName}
        </h4>
        <p className="text-xs text-slate-500 font-medium mt-0.5 truncate pr-4 opacity-80">
          {job.detail}
        </p>
      </div>

      {/* Action Area */}
      <div className="flex items-center justify-between md:flex-col md:items-end gap-2 mt-2 md:mt-0 pl-4 md:border-l md:border-slate-100">
         <div className="scale-95 origin-right">
           {getStatusBadge(job.status)}
         </div>
         
         {job.status !== 'COMPLETED' ? (
           <Button size="sm" variant="outline" className="w-full md:w-auto h-7 text-[10px] font-bold">
             จัดการเคส
           </Button>
         ) : (
           <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-slate-100 text-slate-400">
             <MoreHorizontal className="w-4 h-4" />
           </Button>
         )}
      </div>

    </div>
  </div>
);

const InstructionItem = ({ text }: { text: React.ReactNode }) => (
  <li className="flex gap-3 text-xs text-slate-600 leading-relaxed items-start group">
    <div className="mt-1 w-4 h-4 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-teal-400 group-hover:bg-teal-50 transition-colors shadow-sm">
      <div className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-teal-500"></div>
    </div>
    <span className="pt-0.5 font-medium">{text}</span>
  </li>
);

const SummaryRow = ({ label, value, isTotal, color = "bg-slate-100 text-slate-600" }: any) => (
  <div className="flex items-center justify-between group">
    <span className={`text-xs ${isTotal ? 'font-bold text-slate-700' : 'text-slate-500 font-medium'}`}>
      {label}
    </span>
    {isTotal ? (
       <span className="text-base font-bold text-teal-600 tracking-tight">{value} เคส</span>
    ) : (
       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${color} min-w-[28px] text-center shadow-sm`}>
         {value}
       </span>
    )}
  </div>
);