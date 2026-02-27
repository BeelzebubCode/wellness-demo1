// src/app/(tenant)/(university)/head-consultant/exception-requests/page.tsx
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
    BookCheck, Clock, CheckCircle2, XCircle,
    FileText, ChevronRight, User, CalendarDays, Search, X, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { format, isToday, subDays, startOfMonth } from "date-fns";
import { th } from "date-fns/locale";
import { Spinner } from "@/components/ui/Spinner";
import { ExceptionStatus } from "@prisma/client";
import { useExceptionRequestsQuery } from "@/features/head-consultant/exception-requests/hooks/useExceptionRequestsQuery";
import { DateCalendarPopover } from "@/components/filters/inputs/DateCalendarPopover";
import { toYMD, fromYMD } from "@/lib/date";
import type { ExceptionRequestRow } from "@/features/head-consultant/exception-requests/types";

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, {
    label: string; icon: typeof Clock; bg: string; text: string; border: string;
}> = {
    PENDING_REVIEW: { label: "รอพิจารณา", icon: Clock, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    APPROVED: { label: "อนุมัติแล้ว", icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    REJECTED: { label: "ปฏิเสธ", icon: XCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    DRAFT: { label: "ร่างคำขอ", icon: FileText, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
};

// ─── Date presets ────────────────────────────────────────────────────────────
type DatePreset = "all" | "today" | "3d" | "7d" | "month" | "custom";
const DATE_PRESETS: { key: DatePreset; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "today", label: "วันนี้" },
    { key: "3d", label: "3 วัน" },
    { key: "7d", label: "สัปดาห์" },
    { key: "month", label: "เดือนนี้" },
    { key: "custom", label: "ช่วงวันที่" },
];

function getPresetRange(preset: DatePreset): { from: Date | null; to: Date | null } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (preset) {
        case "today": return { from: today, to: now };
        case "3d": return { from: subDays(today, 3), to: now };
        case "7d": return { from: subDays(today, 7), to: now };
        case "month": return { from: startOfMonth(today), to: now };
        default: return { from: null, to: null };
    }
}

// ─── Shared chip class factory ───────────────────────────────────────────────
const chip = (active: boolean, accent: "primary" | "amber" = "primary") => {
    const colors = accent === "amber"
        ? active
            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
            : "bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:bg-amber-50/60 hover:text-amber-700"
        : active
            ? "bg-primary text-white border-primary shadow-sm"
            : "bg-white text-gray-500 border-gray-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary";
    return `inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 border select-none cursor-pointer ${colors}`;
};

// ─── Main page ───────────────────────────────────────────────────────────────
export default function HeadConsultantExceptionRequestsPage() {
    const [status, setStatus] = useState<ExceptionStatus | "ALL">("PENDING_REVIEW");
    const [datePreset, setDatePreset] = useState<DatePreset>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [search, setSearch] = useState("");

    const { rows, isLoading, error, refresh } = useExceptionRequestsQuery(status, 1);

    // Auto-refresh on mount + every 30s
    useEffect(() => {
        const id = setInterval(refresh, 30_000);
        return () => clearInterval(id);
    }, [refresh]);

    // Handle preset clicks
    const handlePreset = useCallback((p: DatePreset) => {
        setDatePreset(p);
        if (p !== "custom") { setDateFrom(""); setDateTo(""); }
    }, []);

    // Compute the active date range (from presets or custom)
    const dateRange = useMemo(() => {
        if (datePreset === "custom") {
            return {
                from: dateFrom ? fromYMD(dateFrom) : null,
                to: dateTo ? fromYMD(dateTo) : null,
            };
        }
        return getPresetRange(datePreset);
    }, [datePreset, dateFrom, dateTo]);

    // Derived range label for the badge
    const rangeLabel = useMemo(() => {
        if (datePreset === "custom" && dateFrom && dateTo) {
            const f = fromYMD(dateFrom);
            const t = fromYMD(dateTo);
            return `${format(f, "d MMM yyyy", { locale: th })} – ${format(t, "d MMM yyyy", { locale: th })}`;
        }
        return null;
    }, [datePreset, dateFrom, dateTo]);

    // Client-side date + search filtering
    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter(row => {
            // Date filter
            if (dateRange.from || dateRange.to) {
                const d = new Date(row.booking_exception_requested_at);
                if (dateRange.from && d < dateRange.from) return false;
                if (dateRange.to) {
                    const end = new Date(dateRange.to);
                    end.setHours(23, 59, 59, 999);
                    if (d > end) return false;
                }
            }
            // Search
            if (q) {
                const p = row.student.profile;
                const name = p ? `${p.student_prefix || ""}${p.student_first_name_th || ""} ${p.student_last_name_th || ""}`.toLowerCase() : "";
                const hay = `${name} ${row.booking_exception_reason_code || ""} ${row.booking_exception_request_id}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [rows, dateRange, search]);

    return (
        <div className="max-w-5xl mx-auto space-y-4 pb-10">
            {/* ── Header ── */}
            <div>
                <h1 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    <BookCheck className="w-5 h-5 text-primary" />
                    คำขอยกเว้นโทษ
                </h1>
                <p className="text-[11px] text-gray-400 mt-0.5 pl-7">
                    จัดการคำขอยกเว้นโทษจากนิสิตที่ยกเลิกกะทันหัน หรือไม่มาตามนัด
                </p>
            </div>

            {/* ── Unified filter bar ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 space-y-2.5">
                {/* Row 1: Status chips + search */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mr-1 shrink-0">สถานะ</span>
                    {[
                        { key: "PENDING_REVIEW" as const, label: "รอพิจารณา", icon: Clock },
                        { key: "APPROVED" as const, label: "อนุมัติแล้ว", icon: CheckCircle2 },
                        { key: "REJECTED" as const, label: "ปฏิเสธ", icon: XCircle },
                        { key: "ALL" as const, label: "ทั้งหมด", icon: FileText },
                    ].map(t => (
                        <button key={t.key} onClick={() => setStatus(t.key)} className={chip(t.key === status)}>
                            <t.icon className="w-3 h-3" /> {t.label}
                        </button>
                    ))}

                    {/* Separator + count */}
                    <span className="text-gray-200 mx-0.5 hidden sm:inline">|</span>
                    <span className="text-[10px] text-gray-400 tabular-nums whitespace-nowrap">
                        {filteredRows.length}/{rows.length}
                    </span>

                    {/* Search — pushed to the right */}
                    <div className="relative ml-auto">
                        <Search className="w-3.5 h-3.5 text-gray-300 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ค้นหา..."
                            className="h-7 w-36 sm:w-44 pl-7 pr-6 text-[11px] border border-gray-200 rounded-full bg-gray-50/80 placeholder:text-gray-300
                                       focus:bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-150"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Row 2: Date chips + custom range */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mr-1 shrink-0">วันที่</span>

                    {DATE_PRESETS.map(p => (
                        <button key={p.key} onClick={() => handlePreset(p.key)} className={chip(datePreset === p.key, "amber")}>
                            {p.key === "custom" && <CalendarDays className="w-3 h-3" />}
                            {p.label}
                        </button>
                    ))}

                    {/* Inline range badge */}
                    {rangeLabel && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 ml-1">
                            <CalendarDays className="w-3 h-3" /> {rangeLabel}
                        </span>
                    )}
                </div>

                {/* Row 3: Custom date range pickers (only when "ช่วงวันที่" selected) */}
                {datePreset === "custom" && (
                    <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-2 bg-gray-50/80 rounded-lg px-3 py-2 border border-gray-100">
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">จาก</span>
                            <DateCalendarPopover
                                valueYMD={dateFrom}
                                onChangeYMD={v => { setDateFrom(v); setDatePreset("custom"); }}
                                placeholder="วันเริ่ม"
                                closeOnSelect
                                variant="compact"
                            />
                            <span className="text-gray-300 text-xs">→</span>
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">ถึง</span>
                            <DateCalendarPopover
                                valueYMD={dateTo}
                                onChangeYMD={v => { setDateTo(v); setDatePreset("custom"); }}
                                placeholder="วันสิ้นสุด"
                                closeOnSelect
                                variant="compact"
                            />

                            {(dateFrom || dateTo) && (
                                <button
                                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                                    className="ml-auto inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors font-medium"
                                >
                                    <X className="w-3 h-3" /> ล้าง
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Content ── */}
            {error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            ) : isLoading && rows.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner size="lg" className="text-primary" />
                </div>
            ) : filteredRows.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-1.5">
                    {filteredRows.map(req => (
                        <RequestRow key={req.booking_exception_request_id} request={req} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="text-center py-16 bg-gradient-to-b from-gray-50/60 to-white rounded-xl border border-dashed border-gray-200">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 font-medium">ไม่มีคำขอยกเว้นโทษที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนตัวกรอง หรือรอสักครู่แล้วข้อมูลจะรีเฟรชอัตโนมัติ</p>
        </div>
    );
}

// ─── Request row ─────────────────────────────────────────────────────────────
function RequestRow({ request }: { request: ExceptionRequestRow }) {
    const reqDate = new Date(request.booking_exception_requested_at);
    const st = STATUS_CFG[request.booking_exception_status] || {
        label: request.booking_exception_status, icon: FileText,
        bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200",
    };
    const StatusIcon = st.icon;

    const profile = request.student.profile;
    const studentName = profile
        ? `${profile.student_prefix || ""}${profile.student_first_name_th || ""} ${profile.student_last_name_th || ""}`.trim()
        : "ข้อมูลนิสิตไม่สมบูรณ์";

    const slotStart = request.booking.timeSlot?.time_slot_start_datetime
        ? new Date(request.booking.timeSlot.time_slot_start_datetime) : null;
    const slotEnd = request.booking.timeSlot?.time_slot_end_datetime
        ? new Date(request.booking.timeSlot.time_slot_end_datetime) : null;

    return (
        <Link href={`/head-consultant/exception-requests/${request.booking_exception_request_id}`}>
            <div className="group flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-primary/25 hover:shadow-md transition-all duration-200 cursor-pointer">
                {/* Mini ID tile */}
                <div className="shrink-0 w-11 h-11 flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-100 text-center">
                    <span className="text-[7px] text-gray-400 font-medium leading-none">คำขอ</span>
                    <span className="text-xs font-bold text-slate-700 leading-tight">#{request.booking_exception_request_id}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-gray-800 truncate">{studentName}</span>
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-2 py-0.5 border ${st.bg} ${st.text} ${st.border}`}>
                            <StatusIcon className="w-2.5 h-2.5" /> {st.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                        {slotStart && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                <CalendarDays className="w-3 h-3 text-amber-500" />
                                {format(slotStart, "d MMM yy HH:mm", { locale: th })}
                                {slotEnd && <>&ndash;{format(slotEnd, "HH:mm", { locale: th })}</>}
                            </span>
                        )}
                        <span className="text-[10px] text-gray-400 truncate">
                            {request.exceptionReason?.exception_reason_name_th || request.booking_exception_reason_code || "ไม่ระบุเหตุผล"}
                        </span>
                        {request.evidences.length > 0 && (
                            <span className="text-[10px] text-gray-300">
                                {request.evidences.length} หลักฐาน
                            </span>
                        )}
                    </div>
                </div>

                {/* Right */}
                <div className="shrink-0 flex flex-col items-end gap-0.5">
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {format(reqDate, "d MMM yy HH:mm", { locale: th })}
                    </span>
                    <span className="inline-flex items-center text-[11px] text-primary font-medium opacity-60 group-hover:opacity-100 group-hover:underline transition-opacity">
                        ดูรายละเอียด <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                </div>
            </div>
        </Link>
    );
}
