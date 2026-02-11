// src/app/(tenant)/(university)/consultant/schedule/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card, Button } from "@/components/ui";
import {
  ClipboardList,
  Clock3,
  CalendarDays,
  UserRound,
  CheckCircle,
  Loader2,
  Filter,
  ChevronDown,
  X,
  Info,
  CalendarClock,
  Inbox,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterDef } from "@/components/filters/types";
import {
  normalizeYMD,
  toYMD,
  formatThaiDate,
  getCalendarDays,
  isSameDay,
  isToday,
  THAI_DAYS_SHORT,
  THAI_MONTHS,
} from "@/lib/date";
import { cn } from "@/lib/cn";
import { fetchMyBookings } from "@/features/consultant/my-jobs/api/myJobs";

type BookingStatusUI = "UPCOMING" | "COMPLETED" | "CANCELLED" | "IN_PROGRESS";

type MyBookingApiRow = {
  id: number;
  status: string;
  problemType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  date: string | null; // "YYYY-MM-DD"
  startTime: string | null; // "HH:mm"
  endTime: string | null; // "HH:mm"
  studentName?: string | null;
};

type ScheduleItem = {
  id: number;
  dateISO: string; // YYYY-MM-DD
  timeRange: string;
  studentName: string;
  category: string;
  status: BookingStatusUI;
};

// ✅ local date กัน UTC เพี้ยน
const toISODateStringLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatThaiDateFromISO = (iso: string) => {
  if (!iso) return "ทั้งหมด";
  return formatThaiDate(iso, { includeDay: false, short: false });
};

const mapStatus = (s: string): BookingStatusUI => {
  if (s === "COMPLETED") return "COMPLETED";
  if (s === "CANCELLED") return "CANCELLED";
  if (s === "IN_PROGRESS") return "IN_PROGRESS";
  return "UPCOMING"; // ASSIGNED / PENDING_ASSIGNMENT
};

function StatusBadge({ s }: { s: BookingStatusUI }) {
  if (s === "UPCOMING") {
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
        รอให้คำปรึกษา
      </span>
    );
  }
  if (s === "IN_PROGRESS") {
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
        กำลังดำเนินการ
      </span>
    );
  }
  if (s === "COMPLETED") {
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        เสร็จสิ้น
      </span>
    );
  }
  return (
    <span className="text-xs px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-medium">
      ยกเลิก
    </span>
  );
}

function statusLabelTH(s: BookingStatusUI) {
  switch (s) {
    case "UPCOMING":
      return "รอให้คำปรึกษา";
    case "IN_PROGRESS":
      return "กำลังดำเนินการ";
    case "COMPLETED":
      return "เสร็จสิ้น";
    case "CANCELLED":
      return "ยกเลิก";
    default:
      return "-";
  }
}

/* =========================
   Modal (Popup)
========================= */
function DetailModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: ScheduleItem | null;
}) {
  const router = useRouter();

  // ESC ปิด
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
          {/* header */}
          <div className="px-5 py-4 flex items-start justify-between border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                <Info className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  รายละเอียดนัดหมาย
                </p>
                <p className="text-xs text-slate-500">
                  Booking ID: <span className="font-semibold">{item.id}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* content */}
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-800 truncate">
                {item.studentName}
              </div>
              <StatusBadge s={item.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="text-[11px] text-slate-500 font-semibold">
                  วันที่
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {formatThaiDateFromISO(item.dateISO)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="text-[11px] text-slate-500 font-semibold">
                  เวลา
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {item.timeRange}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:col-span-2">
                <div className="text-[11px] text-slate-500 font-semibold">
                  ประเภทปัญหา
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {item.category}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:col-span-2">
                <div className="text-[11px] text-slate-500 font-semibold">
                  สถานะ (ระบบ)
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {statusLabelTH(item.status)}
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              ปิด
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary-600 px-6 font-black rounded-xl"
              onClick={() => {
                // ✅ นำทางไปที่หน้างาานของฉัน พร้อมส่ง ID ไปเพื่อให้ระบบ Highlight/Scroll
                router.push(`/consultant/my-jobs?id=${item.id}`);
                onClose();
              }}
            >
              ไปที่หน้างาน
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* =========================
   Interactive Calendar
========================= */
function ScheduleCalendar({
  countsByDate,
  selectedDateISO,
  onSelectDate,
}: {
  countsByDate: Record<string, number>;
  selectedDateISO: string;
  onSelectDate: (iso: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  const monthLabel = useMemo(() => {
    const y = currentMonth.getFullYear() + 543;
    return `${THAI_MONTHS[currentMonth.getMonth()]} ${y}`;
  }, [currentMonth]);

  return (
    <Card className="rounded-3xl p-3 md:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-white/60 bg-white/80 backdrop-blur-xl transition-all duration-500">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <CalendarDays className="w-4.5 h-4.5 text-primary-600" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-800">ปฏิทินงาน</h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-primary transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-black text-slate-800 min-w-[120px] text-center tracking-tight">
            {monthLabel}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-primary transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-3 text-center">
        {THAI_DAYS_SHORT.map((d, i) => (
          <span key={d} className={cn("text-[10px] font-bold text-slate-400 uppercase tracking-tighter", (i === 0 || i === 6) && "text-rose-400")}>
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 md:gap-2.5">
        {days.map((date, idx) => {
          const iso = toYMD(date);
          const isSelected = iso === selectedDateISO;
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const count = countsByDate[iso] || 0;
          const today = isToday(date);

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(iso)}
              className={cn(
                "group relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300",
                !isCurrentMonth ? "opacity-10 pointer-events-none scale-90" : "hover:scale-110 active:scale-95",
                isSelected
                  ? "bg-primary text-white shadow-lg shadow-primary/25 z-10"
                  : today
                    ? "bg-primary-50 text-primary-600 ring-1 ring-primary-100/30 font-black"
                    : "bg-slate-50/30 hover:bg-white hover:shadow-md text-slate-600 border border-transparent hover:border-slate-100/60"
              )}
            >
              <span className={cn("text-[11px] md:text-sm font-bold", isSelected ? "text-white" : "text-slate-700")}>
                {date.getDate()}
              </span>

              {count > 0 && (
                <>
                  <div className="absolute top-1 right-1">
                    <span className="relative flex h-2 w-2">
                      <span className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        isSelected ? "bg-white" : "bg-primary-400"
                      )}></span>
                      <span className={cn(
                        "relative inline-flex rounded-full h-2 w-2 border border-white shadow-sm",
                        isSelected ? "bg-white" : "bg-primary-500"
                      )}></span>
                    </span>
                  </div>
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl pointer-events-none transition-all duration-300 shadow-xl whitespace-nowrap z-20 scale-50 group-hover:scale-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                      {count} นัดหมาย
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

type ScheduleFilters = {
  date: string;
  status: "ALL" | BookingStatusUI;
  search: string;
};

const SCHEDULE_FILTER_DEFS: FilterDef<ScheduleFilters>[] = [
  {
    key: "status",
    label: "สถานะ",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "ALL" },
      { label: "รอให้คำปรึกษา", value: "UPCOMING" },
      { label: "กำลังดำเนินการ", value: "IN_PROGRESS" },
      { label: "เสร็จสิ้น", value: "COMPLETED" },
      { label: "ยกเลิก", value: "CANCELLED" },
    ],
  },
];

export default function ConsultantSchedulePage() {
  const [filters, setFilters] = useState<ScheduleFilters>({
    date: "", // ✅ Default to all days
    status: "ALL",
    search: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [countsByDate, setCountsByDate] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ total: 0, waiting: 0 });

  const listRef = useRef<HTMLDivElement>(null);

  // ✅ modal state
  const [openDetail, setOpenDetail] = useState(false);
  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);

  const selectedDateStrNorm = useMemo(() => {
    if (!filters.date) return "";
    return normalizeYMD(filters.date);
  }, [filters.date]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    let alive = true;

    async function fetchSchedule() {
      setIsLoading(true);
      try {
        const rows = await fetchMyBookings();

        const all: ScheduleItem[] = rows.map((r) => ({
          id: r.id,
          dateISO: normalizeYMD(r.date ?? ""),
          timeRange: `${r.startTime ?? "--:--"} - ${r.endTime ?? "--:--"} น.`,
          studentName: r.studentName ?? "ไม่ระบุชื่อ",
          category: r.problemType ?? "-",
          status: mapStatus(r.status),
        })).filter(x => !!x.dateISO);

        // ✅ countsByDate should only count ACTIVE jobs to match the list's default 'Active Only' view
        const nextCounts: Record<string, number> = {};
        all
          .filter(x => x.status !== "COMPLETED" && x.status !== "CANCELLED")
          .forEach(x => {
            nextCounts[x.dateISO] = (nextCounts[x.dateISO] || 0) + 1;
          });

        // Filter by Date
        const dayRows = !selectedDateStrNorm
          ? all
          : all.filter((x) => x.dateISO === selectedDateStrNorm);

        // ✅ Default: Exclude COMPLETED and CANCELLED
        const statusFiltered =
          filters.status === "ALL"
            ? dayRows.filter(x => x.status !== "COMPLETED" && x.status !== "CANCELLED")
            : dayRows.filter((x) => x.status === filters.status);

        const q = filters.search.trim().toLowerCase();
        const filtered = !q
          ? statusFiltered
          : statusFiltered.filter((x) => {
              const hay = [x.studentName, x.category, statusLabelTH(x.status)]
                .join(" ")
                .toLowerCase();
              return hay.includes(q);
            });

        const nextStats = {
          total: dayRows.length,
          waiting: dayRows.filter((x) => x.status === "UPCOMING").length,
        };

        if (!alive) return;
        setItems(filtered);
        setCountsByDate(nextCounts);
        setStats(nextStats);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setItems([]);
        setCountsByDate({});
        setStats({ total: 0, waiting: 0 });
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    fetchSchedule();
    return () => {
      alive = false;
    };
  }, [selectedDateStrNorm, filters.status, filters.search]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginatedItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 font-sans text-slate-900 pb-20 relative overflow-hidden">
      
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <main className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-10 space-y-8">
        <DetailModal open={openDetail} onClose={() => setOpenDetail(false)} item={activeItem} />

        {/* ================= HEADER WITH QUICK STATS ================= */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
          {/* Left: Title & Icon */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 bg-gradient-to-br from-white to-blue-50/80 rounded-2xl flex items-center justify-center shadow-lg border border-white/60 shrink-0">
              <div className="w-7 h-7 icon-tenant rounded-xl flex items-center justify-center">
                <CalendarClock className="w-5 h-5" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                ตารางนัดหมาย
              </h1>
              <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
                Personal Schedule Dashboard
              </p>
            </div>
          </div>

          {/* Right: Stats Cards */}
          <div className="flex items-center gap-3">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/80 shadow-sm flex items-center gap-4 min-w-[140px] justify-between transition-all hover:shadow-md">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">งานทั้งหมด</p>
              <p className="text-2xl font-black text-slate-800">{stats.total}</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/80 shadow-sm flex items-center gap-4 min-w-[140px] justify-between transition-all hover:shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 h-full bg-primary-400 opacity-20" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รอดำเนินการ</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-black text-primary-500">{stats.waiting}</p>
                <div className="w-2.5 h-2.5 rounded-full bg-primary-400 animate-pulse ring-4 ring-primary-50" />
              </div>
            </div>
          </div>
        </div>

        {/* ================= SPLIT VIEW CONTAINER ================= */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT: STICKY CALENDAR (Approx 1/3) */}
          <section className="w-full lg:w-[400px] lg:sticky lg:top-10">
            <ScheduleCalendar
              countsByDate={countsByDate}
              selectedDateISO={selectedDateStrNorm}
              onSelectDate={(iso) => {
                setFilters(prev => ({ ...prev, date: iso }));
                if (window.innerWidth < 1024) {
                   setTimeout(() => {
                    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }
              }}
            />
          </section>

          {/* RIGHT: JOB LIST (Approx 2/3) */}
          <section ref={listRef} className="flex-1 w-full">
            
            {/* JOB LIST CARD */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.06)] rounded-[32px] overflow-hidden min-h-[600px] flex flex-col">
              
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100/80 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-white/90 to-blue-50/20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-blue-500 rounded-full shadow-lg"></span>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 leading-none">
                      รายการนัดหมาย {filters.date ? `วันที่ ${formatThaiDateFromISO(selectedDateStrNorm)}` : "(Active List)"}
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-none font-bold uppercase tracking-wider">
                      {items.length} ACTIVE JOBS FOUND
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {filters.date && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, date: "" }))}
                      className="h-8 text-[10px] font-black text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-4 rounded-xl border border-primary-100/50"
                    >
                      ดูทั้งหมด
                    </Button>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Active Only</span>
                  </div>
                </div>
              </div>

              {/* List Content */}
              <div className="flex-1 p-6 bg-gradient-to-b from-slate-50/40 to-white/40">
                {isLoading ? (
                  <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-sm font-black tracking-tight">กำลังโหลดตารางงาน...</p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 gap-4">
                    <div className="w-20 h-20 bg-slate-100/80 rounded-[28px] flex items-center justify-center shadow-inner">
                      <Inbox className="w-10 h-10 text-slate-300" />
                    </div>
                    <div className="text-center px-6">
                      <p className="text-sm font-black text-slate-700">
                        {filters.date ? `ไม่พบงานนัดหมายในวันที่ ${formatThaiDateFromISO(selectedDateStrNorm)}` : "ยังไม่มีรายการงานที่เปิดอยู่"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-2 max-w-[240px] leading-relaxed">
                        ลองเปลี่ยนวันที่บนปฏิทิน หรือเลือกดูงานสถานะอื่นๆ (เสร็จสิ้น/ยกเลิก) ผ่านตัวกรองด้านบน
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedItems.map((item) => (
                      <Card key={item.id} className="group rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 bg-white border-white/60 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-primary transition-colors duration-500" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-primary-50 group-hover:scale-110 transition-all duration-500">
                              <UserRound className="w-5 h-5 text-slate-400 group-hover:text-primary-600" />
                            </div>
                            
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 mb-1">
                                <StatusBadge s={item.status} />
                                <div className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                                  <Clock3 className="w-3.5 h-3.5 text-emerald-500" />
                                  {item.timeRange}
                                </div>
                              </div>
                              <h3 className="text-base font-black text-slate-800 truncate">{item.studentName}</h3>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold">
                                <span className="flex items-center gap-1">
                                  {formatThaiDateFromISO(item.dateISO)}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="truncate">{item.category}</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-6 text-[11px] font-black rounded-2xl border-slate-100 bg-slate-50 hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 shadow-sm"
                            onClick={() => {
                              setActiveItem(item);
                              setOpenDetail(true);
                            }}
                          >
                            จัดการงาน
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-8 py-5 border-t border-slate-100/80 bg-white/50 backdrop-blur-sm flex items-center justify-between">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    PAGE {currentPage} / {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm active:scale-90"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm active:scale-90"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
