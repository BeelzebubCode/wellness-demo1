// src/app/(tenant)/(university)/consultant/my-jobs/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  CalendarClock,
  Clock3,
  PlayCircle,
  CheckCircle2,
  MoreHorizontal,
  Loader2,
  ChevronDown,
  Info,
  X,
  Send,
  AlertTriangle,
} from "lucide-react";

import { FilterBar } from "@/components/filters/FilterBar";
import {
  CONSULTANT_MY_JOBS_FILTER_DEFS,
  type ConsultantMyJobsFilters,
} from "@/features/consultant-my-jobs/filters/defs";

// ====================================================================
// UI COMPONENTS (Compact & Premium Style - สไตล์เดิมที่คุณชอบ)
// ====================================================================

const Card = ({
  className,
  children,
  noPadding = false,
}: {
  className?: string;
  children: React.ReactNode;
  noPadding?: boolean;
}) => (
  <div
    className={`relative bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl ${
      noPadding ? "" : "p-4"
    } ${className || ""}`}
  >
    {children}
  </div>
);

const Button = ({
  children,
  variant = "primary",
  size = "default",
  className,
  onClick,
  disabled,
  type = "button",
}: any) => {
  const baseStyle =
    "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-95";

  const variants: any = {
    primary: "btn-tenant shadow-md hover:-translate-y-0.5 active:translate-y-0",
    outline:
      "border border-slate-200 bg-white/60 text-slate-700 hover:border-primary hover:text-primary hover:bg-white",
    ghost: "hover:bg-slate-100 text-slate-600",
    danger:
      "bg-rose-600 text-white shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5",
  };

  const sizes: any = {
    default: "h-8 px-4 text-xs",
    sm: "h-7 px-3 text-[10px]",
    icon: "h-8 w-8 p-0",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${
        className || ""
      }`}
    >
      {children}
    </button>
  );
};

// Formatter
const formatThaiDate = (date: Date) => {
  return date.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const toISODateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function fromYMD(s: string) {
  // s = "YYYY-MM-DD"
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ====================================================================
// TYPES (ใช้ของจริงจาก API v2 /bookings/my แล้ว map เป็น UI)
// ====================================================================

type BookingStatusUI = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type Job = {
  id: number;
  timeRange: string;
  status: BookingStatusUI;
  userName: string;
  category: string;

  detail: string;
  bookingDetailText?: string | null;

  raw?: {
    date?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
};

type MyBookingApiRow = {
  id: number;
  status: string; // prisma BookingStatus
  problemType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  date: string | null; // "YYYY-MM-DD"
  startTime: string | null; // "HH:mm"
  endTime: string | null; // "HH:mm"
  studentName?: string | null;
  bookingDetailText?: string | null;
};

type OutcomeDraft = {
  consultantNote: string;
  nextStep: string;
  riskLevel: number | null;
};

export default function ConsultantMyJobsPage() {
  // ✅ Filters (แทน selectedDate + statusFilter เดิม)
  const [filters, setFilters] = useState<ConsultantMyJobsFilters>(() => ({
    date: toISODateString(new Date()),
    status: "ALL",
    search: "",
  }));

  const selectedDate = useMemo(() => fromYMD(filters.date), [filters.date]);
  const selectedDateStr = filters.date;
  const statusFilter = filters.status;
  const search = filters.search ?? "";

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ✅ confirm รับเคส
  const [confirmAccept, setConfirmAccept] = useState<{
    open: boolean;
    job: Job | null;
  }>({ open: false, job: null });

  // ✅ modal ส่งงาน + ฟอร์ม
  const [outcomeModal, setOutcomeModal] = useState<{
    open: boolean;
    job: Job | null;
  }>({ open: false, job: null });

  const [outcomeDraft, setOutcomeDraft] = useState<OutcomeDraft>({
    consultantNote: "",
    nextStep: "",
    riskLevel: 2,
  });

  // Stats State
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((x) => x + 1);

  // ✅ map status จาก Prisma -> UI (ยึด DB ล้วน ๆ)
  const mapStatus = (s: string): BookingStatusUI => {
    const db = String(s || "").toUpperCase();
    if (db === "IN_PROGRESS") return "IN_PROGRESS";
    if (db === "COMPLETED") return "COMPLETED";
    if (db === "CANCELLED") return "CANCELLED";
    return "PENDING";
  };

  async function updateBookingStatus(
    id: number,
    status: "IN_PROGRESS" | "COMPLETED"
  ): Promise<BookingStatusUI | null> {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/v2/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "อัปเดตสถานะไม่สำเร็จ");

      const dbStatus = String(data?.booking?.booking_status || "").toUpperCase();
      return mapStatus(dbStatus);
    } catch (err) {
      console.error(err);
      alert((err as any)?.message ?? "อัปเดตสถานะไม่สำเร็จ");
      return null;
    } finally {
      setActionLoadingId(null);
    }
  }

  const handleAction = async (job: Job) => {
    if (actionLoadingId) return;

    if (job.status === "PENDING") {
      setConfirmAccept({ open: true, job });
      return;
    }

    if (job.status === "IN_PROGRESS") {
      setOutcomeDraft({
        consultantNote: "",
        nextStep: "",
        riskLevel: 2,
      });
      setOutcomeModal({ open: true, job });
      return;
    }

    alert("เคสนี้ปิดแล้ว/ยกเลิกแล้ว");
  };

  const confirmAcceptJob = async () => {
    const job = confirmAccept.job;
    if (!job) return;

    const next = await updateBookingStatus(job.id, "IN_PROGRESS");
    if (!next) return;

    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status: next } : j))
    );

    setStats((s) => ({
      ...s,
      pending: Math.max(0, s.pending - 1),
      inProgress: s.inProgress + 1,
    }));

    setConfirmAccept({ open: false, job: null });
  };

  const submitOutcomeAndComplete = async () => {
    const job = outcomeModal.job;
    if (!job) return;

    if (!outcomeDraft.consultantNote.trim()) {
      alert("กรุณากรอกสรุป/รายละเอียดการให้คำปรึกษา");
      return;
    }

    setActionLoadingId(job.id);
    try {
      const res = await fetch(`/api/v2/bookings/${job.id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          consultantNote: outcomeDraft.consultantNote,
          nextStep: outcomeDraft.nextStep?.trim()
            ? outcomeDraft.nextStep.trim()
            : null,
          riskLevel: outcomeDraft.riskLevel,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "ส่งงานไม่สำเร็จ");

      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: "COMPLETED" } : j))
      );

      setStats((s) => ({
        ...s,
        inProgress: Math.max(0, s.inProgress - 1),
        completed: s.completed + 1,
      }));

      setOutcomeModal({ open: false, job: null });
      setExpandedId(job.id);
      triggerRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "ส่งงานไม่สำเร็จ");
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Fetch งานจริง ---
  useEffect(() => {
    let alive = true;

    async function fetchMyJobs() {
      setIsLoading(true);

      try {
        const res = await fetch("/api/v2/bookings/my", {
          credentials: "include",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "โหลดงานไม่สำเร็จ");

        const rows = (data.bookings ?? []) as MyBookingApiRow[];

        // ✅ filter ตามวัน
        const dayRows = rows.filter((r) => r.date === selectedDateStr);

        // ✅ filter ตามสถานะที่เลือก
        const byStatus =
          statusFilter === "ALL"
            ? dayRows
            : dayRows.filter((r) => mapStatus(r.status) === statusFilter);

        // ✅ filter search (ชื่อ/หมวด/รายละเอียด)
        const q = search.trim().toLowerCase();
        const filteredRows = !q
          ? byStatus
          : byStatus.filter((r) => {
              const hay = [
                r.studentName,
                r.problemType,
                r.bookingDetailText,
                r.status,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              return hay.includes(q);
            });

        // ✅ map เป็น UI jobs
        const mapped: Job[] = filteredRows.map((r) => {
          const detailFull = (r.bookingDetailText ?? "").trim();
          const preview =
            detailFull.length > 70 ? detailFull.slice(0, 70) + "..." : detailFull;

          return {
            id: r.id,
            timeRange: `${r.startTime ?? "--:--"} - ${r.endTime ?? "--:--"}`,
            status: mapStatus(r.status),
            userName: r.studentName ?? "ไม่ระบุชื่อ",
            category: r.problemType ?? "-",
            detail: preview || "-",
            bookingDetailText: r.bookingDetailText ?? null,
            raw: {
              date: r.date,
              startTime: r.startTime,
              endTime: r.endTime,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
            },
          };
        });

        // ✅ stats ของวันนั้น (นับจาก dayRows ก่อน filter)
        const statuses = dayRows.map((r) => mapStatus(r.status));
        const nextStats = {
          today: statuses.length,
          pending: statuses.filter((s) => s === "PENDING").length,
          inProgress: statuses.filter((s) => s === "IN_PROGRESS").length,
          completed: statuses.filter((s) => s === "COMPLETED").length,
        };

        if (!alive) return;
        setJobs(mapped);
        setStats(nextStats);
      } catch (err) {
        console.error(err);
        if (!alive) return;
        setJobs([]);
        setStats({ today: 0, pending: 0, inProgress: 0, completed: 0 });
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    fetchMyJobs();

    return () => {
      alive = false;
    };
  }, [selectedDateStr, statusFilter, search, refreshKey]);

  const getStatusBadge = (status: BookingStatusUI) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
            รอดำเนินการ
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
            กำลังคุย
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
            เสร็จสิ้น
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
            ยกเลิก
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-tenant font-sans text-slate-900 pb-20 relative overflow-hidden selection:bg-[rgba(var(--ring),0.25)] selection:text-slate-900">
      <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* ================= 1. HEADER & CONTROLS ================= */}
        <div className="flex flex-col gap-4 pb-4 border-b border-slate-200/60">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
              <div className="w-6 h-6 icon-tenant rounded-lg flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-col space-y-[4px]">
              <p className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
                งานของฉัน
              </p>
              <p className="text-sm font-medium text-slate-500 leading-none">
                ดูคิวที่รับผิดชอบ และจัดการสถานะการให้คำปรึกษา
              </p>
            </div>
          </div>

          {/* ✅ FilterBar (แทน input date + select เดิม) */}
          <FilterBar
            defs={CONSULTANT_MY_JOBS_FILTER_DEFS}
            value={filters}
            onChange={(next) => {
              // เปลี่ยนวันแล้วพับการ์ด
              if (next.date !== filters.date) setExpandedId(null);
              setFilters(next);
            }}
            dateKey={"date"}
            searchKey={"search"}
            searchPlaceholder="ค้นหาชื่อ / หมวด / รายละเอียด..."
          />
        </div>

        {/* ================= 2. STATS WIDGETS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatWidget title="นัดหมายวันนี้" value={stats.today} icon={CalendarClock} theme="tenant" />
          <StatWidget title="รอดำเนินการ" value={stats.pending} icon={Clock3} theme="tenant" />
          <StatWidget title="กำลังดำเนินการ" value={stats.inProgress} icon={PlayCircle} theme="tenant" />
          <StatWidget title="ปิดเคสแล้ว" value={stats.completed} icon={CheckCircle2} theme="tenant" />
        </div>

        {/* ================= 3. CONTENT GRID ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Left Column: List */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            <Card className="min-h-[500px] flex flex-col overflow-hidden shadow-md" noPadding>
              {/* Header inside Card */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white/60 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full"></span>
                  <p className="text-sm font-bold text-slate-800 leading-none">
                    รายการนัดหมาย
                  </p>
                </div>

                <div className="px-2.5 py-0.5 bg-white rounded-md text-slate-600 text-[12px] font-semibold border border-slate-200 shadow-sm leading-none">
                  {formatThaiDate(selectedDate)}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 bg-slate-50/50">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <span className="text-xs font-medium">กำลังโหลด...</span>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-16">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-50">
                      <ClipboardList className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-600">ว่างจังเลย!</p>
                      <p className="text-xs text-slate-400 mt-1">
                        ยังไม่มีงานที่ต้องดำเนินการ
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <JobItem
                        key={job.id}
                        job={job}
                        expanded={expandedId === job.id}
                        onToggle={() =>
                          setExpandedId((cur) => (cur === job.id ? null : job.id))
                        }
                        getStatusBadge={getStatusBadge}
                        onAction={() => handleAction(job)}
                        isActing={actionLoadingId === job.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* ================= MODALS ================= */}

      <ConfirmModal
        open={confirmAccept.open}
        title="ยืนยันการรับเคส"
        description={
          confirmAccept.job
            ? `ต้องการรับเคสของ “${confirmAccept.job.userName}” ใช่ไหม?`
            : ""
        }
        confirmText="ยืนยันรับเคส"
        cancelText="ยกเลิก"
        loading={!!confirmAccept.job && actionLoadingId === confirmAccept.job.id}
        onClose={() => setConfirmAccept({ open: false, job: null })}
        onConfirm={confirmAcceptJob}
      />

      <OutcomeModal
        open={outcomeModal.open}
        job={outcomeModal.job}
        draft={outcomeDraft}
        setDraft={setOutcomeDraft}
        loading={!!outcomeModal.job && actionLoadingId === outcomeModal.job.id}
        onClose={() => setOutcomeModal({ open: false, job: null })}
        onSubmit={submitOutcomeAndComplete}
      />
    </div>
  );
}

// ====================================================================
// SUB-COMPONENTS (เดิม)
// ====================================================================

const StatWidget = ({ title, value, icon: Icon, theme }: any) => {
  const themeStyles: any = {
    tenant: { bg: "icon-tenant", text: "text-primary", border: "border-slate-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  };

  const t = themeStyles[theme] || themeStyles.tenant;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
      <div className="flex items-start justify-between">
        <div className="relative z-10">
          <p className="text-xs font-semibold text-slate-400 mb-0.5">{title}</p>
          <h4 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
        </div>

        <div className={`p-2.5 rounded-lg ${t.bg} border ${t.border}`}>
          <Icon className={`w-5 h-5 ${t.text}`} />
        </div>
      </div>
    </div>
  );
};

const JobItem = ({
  job,
  expanded,
  onToggle,
  getStatusBadge,
  onAction,
  isActing,
}: {
  job: Job;
  expanded: boolean;
  onToggle: () => void;
  getStatusBadge: (s: any) => React.ReactNode;
  onAction: () => void;
  isActing: boolean;
}) => {
  const actionLabel =
    job.status === "PENDING"
      ? "รับเคส"
      : job.status === "IN_PROGRESS"
      ? "ส่งงาน"
      : "ดูรายละเอียด";

  const isDisabled = job.status === "COMPLETED" || job.status === "CANCELLED";

  return (
    <div
      className={`group relative bg-white rounded-xl border shadow-sm transition-all duration-300 overflow-hidden
    ${expanded ? "border-primary/30 ring-2 ring-[rgba(var(--ring),0.18)]" : "border-slate-100 hover:border-primary/30"}
      `}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
    >
      <div className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-shrink-0 flex md:flex-col items-center justify-center gap-2 md:gap-0 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 min-w-[90px] text-center">
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
              เวลา
            </span>
            <span className="text-slate-800 font-bold text-xs whitespace-nowrap">
              {job.timeRange}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-bold border border-slate-200 uppercase tracking-wide">
                {job.category}
              </span>
            </div>
            <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">
              {job.userName}
            </h4>
            <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1 opacity-90">
              {expanded ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  expanded ? "rotate-180" : "rotate-0"
                }`}
              />
            </p>
          </div>

          <div className="flex items-center justify-between md:flex-col md:items-end gap-2 mt-2 md:mt-0 pl-4 md:border-l md:border-slate-100">
            <div className="scale-95 origin-right">{getStatusBadge(job.status)}</div>

            {!isDisabled ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e: any) => {
                  e.stopPropagation();
                  onAction();
                }}
                disabled={isActing}
                className="w-full md:w-auto h-7 text-[10px] font-bold"
              >
                {isActing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    กำลังอัปเดต
                  </>
                ) : job.status === "IN_PROGRESS" ? (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    {actionLabel}
                  </>
                ) : (
                  actionLabel
                )}
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full hover:bg-slate-100 text-slate-400"
                disabled
                onClick={(e: any) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden border-t border-slate-100 bg-slate-50/60">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700">รายละเอียดงาน</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Booking ID: <span className="font-semibold">{job.id}</span>
                </p>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  job.status === "PENDING"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : job.status === "IN_PROGRESS"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                    : job.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-rose-50 text-rose-700 border-rose-100"
                }`}
              >
                {job.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoRow label="วันที่" value={job.raw?.date ?? "-"} />
              <InfoRow label="เวลา" value={job.timeRange} />
            </div>

            <div className="mt-3 rounded-xl border border-slate-100 bg-white/70 p-3">
              <p className="text-[10px] font-bold text-slate-500">รายละเอียดปัญหา</p>
              <p className="mt-1 text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                {job.bookingDetailText?.trim() ? job.bookingDetailText : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 bg-white/70 border border-slate-100 rounded-lg px-3 py-2">
    <span className="text-[10px] font-bold text-slate-500">{label}</span>
    <span className="text-[11px] font-semibold text-slate-700 truncate">{value}</span>
  </div>
);

const InstructionItem = ({ text }: { text: React.ReactNode }) => (
  <li className="flex gap-3 text-xs text-slate-600 leading-relaxed items-start group">
    <div className="mt-1 w-4 h-4 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-primary group-hover:bg-[rgba(var(--ring),0.12)] transition-colors shadow-sm">
      <div className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-primary"></div>
    </div>
    <span className="pt-0.5 font-medium">{text}</span>
  </li>
);

const SummaryRow = ({
  label,
  value,
  isTotal,
  color = "bg-slate-100 text-slate-600",
}: any) => (
  <div className="flex items-center justify-between group">
    <span
      className={`text-xs ${
        isTotal ? "font-bold text-slate-700" : "text-slate-500 font-medium"
      }`}
    >
      {label}
    </span>
    {isTotal ? (
      <span className="text-base font-bold text-primary tracking-tight">
        {value} เคส
      </span>
    ) : (
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${color} min-w-[28px] text-center shadow-sm`}
      >
        {value}
      </span>
    )}
  </div>
);

// ====================================================================
// MODALS (เดิม)
// ====================================================================

function ModalShell({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-800 truncate">
              {title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  description,
  confirmText,
  cancelText,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell open={open} title={title} onClose={onClose}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              กำลังดำเนินการ
            </>
          ) : (
            confirmText
          )}
        </Button>
      </div>
    </ModalShell>
  );
}

function OutcomeModal({
  open,
  job,
  draft,
  setDraft,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  job: Job | null;
  draft: OutcomeDraft;
  setDraft: React.Dispatch<React.SetStateAction<OutcomeDraft>>;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <ModalShell
      open={open}
      title={job ? `ส่งงาน: ${job.userName}` : "ส่งงาน"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">
                {job?.category ?? "-"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เวลา {job?.timeRange ?? "-"} • Booking ID {job?.id ?? "-"}
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              IN_PROGRESS
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">
            สรุป/รายละเอียดการให้คำปรึกษา <span className="text-rose-600">*</span>
          </label>
          <textarea
            value={draft.consultantNote}
            onChange={(e) =>
              setDraft((d) => ({ ...d, consultantNote: e.target.value }))
            }
            rows={5}
            placeholder="พิมพ์สรุปประเด็น, แนวทางที่ให้คำแนะนำ, ข้อสังเกต ฯลฯ"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-tenant"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">
            ขั้นตอนถัดไป (Next step)
          </label>
          <input
            value={draft.nextStep}
            onChange={(e) =>
              setDraft((d) => ({ ...d, nextStep: e.target.value }))
            }
            placeholder='เช่น "นัดติดตามผล 2 สัปดาห์"'
            className="mt-2 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-tenant"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">
            ระดับความเสี่ยง (Risk level)
          </label>
          <select
            value={draft.riskLevel ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                riskLevel: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="mt-2 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-tenant"
          >
            <option value="1">1 - ต่ำ</option>
            <option value="2">2 - ค่อนข้างต่ำ</option>
            <option value="3">3 - กลาง</option>
            <option value="4">4 - สูง</option>
            <option value="5">5 - สูงมาก</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            * ปรับช่วงคะแนนได้ตาม policy ของศูนย์
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            ยกเลิก
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังส่งงาน
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                ส่งงาน
              </>
            )}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
