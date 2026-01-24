// src/app/(tenant)/(university)/consultant/schedule/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

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
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
              onClick={() => {
                // ไว้ต่อยอด: ปุ่มเริ่มให้คำปรึกษา / ปิดเคส
                onClose();
              }}
            >
              ตกลง
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsultantSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatusUI>(
    "ALL"
  );

  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0 });

  // ✅ modal state
  const [openDetail, setOpenDetail] = useState(false);
  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);

  const selectedDateStr = useMemo(
    () => toISODateStringLocal(selectedDate),
    [selectedDate]
  );

  const handleChangeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!v) return;
    const [y, m, d] = v.split("-").map(Number);
    setSelectedDate(new Date(y, m - 1, d)); // ✅ local
  };

  useEffect(() => {
    let alive = true;

    async function fetchSchedule() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/v2/bookings/my", {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "โหลดตารางนัดหมายไม่สำเร็จ");

        const rows = (data.bookings ?? []) as MyBookingApiRow[];

        const all: ScheduleItem[] = rows
          .filter((r) => !!r.date)
          .map((r) => ({
            id: r.id,
            dateISO: r.date!,
            timeRange: `${r.startTime ?? "--:--"} - ${r.endTime ?? "--:--"} น.`,
            studentName: r.studentName ?? "ไม่ระบุชื่อ",
            category: r.problemType ?? "-",
            status: mapStatus(r.status),
          }));

        const dayRows = all.filter((x) => x.dateISO === selectedDateStr);
        const filtered =
          statusFilter === "ALL"
            ? dayRows
            : dayRows.filter((x) => x.status === statusFilter);

        const nextStats = {
          total: dayRows.length,
          today: dayRows.filter((x) => x.status === "UPCOMING").length,
        };

        if (!alive) return;
        setItems(filtered);
        setStats(nextStats);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setItems([]);
        setStats({ total: 0, today: 0 });
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    fetchSchedule();
    return () => {
      alive = false;
    };
  }, [selectedDateStr, statusFilter]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* POPUP */}
      <DetailModal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        item={activeItem}
      />

      {/* TITLE + CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary-600" />
            ตารางนัดให้คำปรึกษา
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ดูรายการนัดหมายที่ต้องให้คำปรึกษา (เฉพาะงานของคุณ)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={selectedDateStr}
              onChange={handleChangeDate}
              className="pl-9 pr-3 h-9 w-full sm:w-[180px] bg-white border border-gray-200 hover:border-primary-400 rounded-lg text-sm font-semibold text-gray-700 shadow-sm"
            />
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | BookingStatusUI)
              }
              className="pl-9 pr-9 h-9 w-full sm:w-[180px] bg-white border border-gray-200 hover:border-primary-400 rounded-lg text-sm font-semibold text-gray-700 shadow-sm appearance-none cursor-pointer"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="UPCOMING">รอให้คำปรึกษา</option>
              <option value="IN_PROGRESS">กำลังดำเนินการ</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LIST */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <Card className="rounded-2xl p-10 shadow-sm flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
              <span className="text-sm text-gray-600 font-medium">
                กำลังโหลดตารางนัดหมาย...
              </span>
            </Card>
          ) : items.length === 0 ? (
            <Card className="rounded-2xl p-10 shadow-sm text-center">
              <p className="text-sm font-semibold text-gray-700">
                ไม่มีนัดหมายในวันที่ {formatThaiDateFromISO(selectedDateStr)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ลองเปลี่ยนวันที่ หรือปรับสถานะดูนะ
              </p>
            </Card>
          ) : (
            items.map((item) => (
              <Card
                key={item.id}
                className="rounded-2xl p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <CalendarDays className="w-4 h-4 text-primary-500" />
                      {formatThaiDateFromISO(item.dateISO)}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock3 className="w-4 h-4 text-emerald-600" />
                      {item.timeRange}
                    </div>

                    <div className="mt-2 text-sm bg-gray-100 rounded-lg px-3 py-2 inline-block">
                      ประเภทปัญหา:{" "}
                      <span className="font-medium text-gray-800">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 truncate">
                      <UserRound className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.studentName}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <StatusBadge s={item.status} />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveItem(item);
                      setOpenDetail(true);
                    }}
                  >
                    ดูรายละเอียด
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* SUMMARY */}
        <div className="space-y-4">
          <Card className="rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary-500" />
              สรุปตารางงาน (รายวัน)
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>นัดหมายทั้งหมด</span>
                <span className="font-semibold text-gray-800">
                  {stats.total} รายการ
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>รอให้คำปรึกษา</span>
                <span className="font-semibold text-gray-800">
                  {stats.today} รายการ
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              วันที่:{" "}
              <span className="font-semibold text-gray-700">
                {formatThaiDateFromISO(selectedDateStr)}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
