// src/features/booking/components/exception-requests/ExceptionRequestsPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import {
    AlertTriangle, Clock, CheckCircle2, XCircle, FileText, Plus,
    ShieldAlert, Timer, Ban, Paperclip, ChevronDown, AlertCircle, Calendar, X,
} from "lucide-react";
import { Card, LoadingSpinner, Button } from "@/components/ui";
import { BookingExceptionRequestModal } from "../shared/BookingExceptionRequestModal";
import {
    useMyExceptionRequests,
    type ExceptionRequestItem,
    type PenaltyBooking,
    type TrustStatusInfo,
} from "../../hooks/useMyExceptionRequests";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { labelTh: string; icon: any; bgColor: string; textColor: string; borderColor: string }> = {
    DRAFT: { labelTh: "แบบร่าง", icon: FileText, bgColor: "bg-gray-50", textColor: "text-gray-600", borderColor: "border-gray-200" },
    PENDING_REVIEW: { labelTh: "รอพิจารณา", icon: Clock, bgColor: "bg-amber-50", textColor: "text-amber-700", borderColor: "border-amber-200" },
    APPROVED: { labelTh: "อนุมัติแล้ว", icon: CheckCircle2, bgColor: "bg-emerald-50", textColor: "text-emerald-700", borderColor: "border-emerald-200" },
    REJECTED: { labelTh: "ถูกปฏิเสธ", icon: XCircle, bgColor: "bg-red-50", textColor: "text-red-600", borderColor: "border-red-200" },
};

const REASON_LABELS: Record<string, string> = {
    MEDICAL: "ป่วย/สุขภาพ", EMERGENCY: "เหตุฉุกเฉิน", ACADEMIC: "เหตุผลทางวิชาการ/สอบ", OTHER: "อื่นๆ",
};

const PENALTY_LABELS: Record<string, { label: string; color: string }> = {
    LATE_CANCEL: { label: "ยกเลิก 6-24 ชม.", color: "text-amber-600 bg-amber-50 border-amber-200" },
    VERY_LATE_CANCEL: { label: "ยกเลิก < 6 ชม.", color: "text-red-600 bg-red-50 border-red-200" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string | null | undefined) {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

function formatTime(iso: string | null | undefined) {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso: string | null | undefined) {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${d.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} ${d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`;
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(targetDate: string | null) {
    const [remaining, setRemaining] = useState("");
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!targetDate) { setIsExpired(true); return; }

        function update() {
            const diff = new Date(targetDate!).getTime() - Date.now();
            if (diff <= 0) { setIsExpired(true); setRemaining("หมดเวลา"); return; }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours >= 24) {
                const days = Math.floor(hours / 24);
                const hrs = hours % 24;
                setRemaining(`${days} วัน ${hrs} ชม.`);
            } else {
                setRemaining(`${hours} ชม. ${minutes} น. ${seconds} วิ`);
            }
            setIsExpired(false);
        }

        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [targetDate]);

    return { remaining, isExpired };
}

// ─── Trust Status Banner ──────────────────────────────────────────────────────
function TrustBanner({ trust }: { trust: TrustStatusInfo }) {
    const isLocked = trust.lockedUntil && new Date(trust.lockedUntil) > new Date();
    const { remaining } = useCountdown(trust.lockedUntil);

    if (!isLocked && trust.lateCancelCount === 0 && trust.noShowCount === 0) return null;

    return (
        <div className={`rounded-xl border-2 p-4 ${isLocked ? "border-red-300 bg-gradient-to-r from-red-50 to-orange-50" : "border-amber-200 bg-amber-50"}`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isLocked ? "bg-red-100" : "bg-amber-100"}`}>
                    {isLocked ? <Ban className="w-5 h-5 text-red-600" /> : <ShieldAlert className="w-5 h-5 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm ${isLocked ? "text-red-700" : "text-amber-700"}`}>
                        {isLocked ? "⚠️ ถูกระงับสิทธิ์การจองชั่วคราว" : "สถานะความเสี่ยง"}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        {trust.lateCancelCount > 0 && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                ยกเลิก 6-24 ชม.: {trust.lateCancelCount}/3 ครั้ง
                            </span>
                        )}
                        {trust.noShowCount > 0 && (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full border border-red-200 font-medium">
                                <XCircle className="w-3 h-3" />
                                ขาดนัด (&lt;6 ชม.): {trust.noShowCount} ครั้ง
                            </span>
                        )}
                        {isLocked && (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full border border-red-200 font-semibold">
                                <Timer className="w-3 h-3" />
                                ล็อกอีก: {remaining}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        หากมีเหตุผลสมควร สามารถยื่นคำขอยกเว้นโทษต่อการจองที่ถูกยกเลิกด้านล่าง
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Penalty Booking Card ─────────────────────────────────────────────────────
function PenaltyBookingCard({ b, onSubmit }: { b: PenaltyBooking; onSubmit: (id: number) => void }) {
    const { remaining, isExpired: countdownExpired } = useCountdown(b.deadlineAt);
    const expired = b.isExpired || countdownExpired;
    const slotDate = b.timeSlot?.time_slot_start_datetime;
    const problemName = b.problemCategory?.problem_category_name_th ?? "ไม่ระบุ";
    const penaltyInfo = PENALTY_LABELS[b.penaltyType] ?? PENALTY_LABELS.LATE_CANCEL;

    const hasRequest = !!b.exceptionRequest;
    const requestStatus = b.exceptionRequest?.booking_exception_status;

    let statusBadge: React.ReactNode;
    let actionButton: React.ReactNode;

    if (hasRequest && requestStatus === "PENDING_REVIEW") {
        statusBadge = (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <Clock className="w-3 h-3" /> รอพิจารณา
            </span>
        );
        actionButton = null;
    } else if (hasRequest && requestStatus === "APPROVED") {
        statusBadge = (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3" /> อนุมัติแล้ว
            </span>
        );
        actionButton = null;
    } else if (hasRequest && requestStatus === "REJECTED") {
        statusBadge = (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                <XCircle className="w-3 h-3" /> ถูกปฏิเสธ
            </span>
        );
        actionButton = b.canSubmit ? (
            <Button size="sm" variant="outline" className="h-8 text-xs border-primary-200 text-primary-700 hover:bg-primary-50 shrink-0"
                onClick={() => onSubmit(b.booking_id)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> ยื่นใหม่
            </Button>
        ) : null;
    } else if (expired) {
        statusBadge = (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
                <Ban className="w-3 h-3" /> หมดเวลายื่น
            </span>
        );
        actionButton = null;
    } else {
        statusBadge = null;
        actionButton = (
            <Button size="sm" className="h-8 text-xs bg-primary-600 hover:bg-primary-700 text-white shrink-0 shadow-sm"
                onClick={() => onSubmit(b.booking_id)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> ยื่นคำขอ
            </Button>
        );
    }

    return (
        <div className={`flex items-center gap-3 p-3.5 rounded-lg border transition-colors ${expired && !hasRequest ? "bg-gray-50 border-gray-200 opacity-70" : "bg-white border-gray-200 hover:border-primary-200"}`}>
            {slotDate ? (
                <div className="shrink-0 w-[48px] flex flex-col items-center rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <div className="w-full bg-gray-100 text-[9px] font-medium text-gray-500 text-center py-0.5 border-b">
                        {new Date(slotDate).toLocaleDateString("th-TH", { weekday: "short" })}
                    </div>
                    <div className="text-lg font-bold text-gray-800 py-0.5">
                        {new Date(slotDate).getDate()}
                    </div>
                </div>
            ) : (
                <div className="w-[48px] shrink-0" />
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-gray-400">#{String(b.booking_id).padStart(6, "0")}</span>
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-2 py-0.5 border ${penaltyInfo.color}`}>
                        {penaltyInfo.label}
                    </span>
                    {statusBadge}
                </div>
                <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{problemName}</p>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400">
                    {slotDate && <span>{formatTime(slotDate)}–{formatTime(b.timeSlot?.time_slot_end_datetime)} น.</span>}
                    {b.cancellation?.cancellationReason && (
                        <span>เหตุผล: {b.cancellation.cancellationReason.cancellation_reason_name_th ?? b.cancellation.cancellationReason.cancellation_reason_name_en}</span>
                    )}
                </div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1.5">
                {actionButton}
                {!expired && !hasRequest && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-orange-600 font-medium">
                        <Timer className="w-3 h-3" />
                        เหลือ {remaining}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Exception Request Card ──────────────────────────────────────────────────
function ExceptionRequestCard({ item, onResubmit }: { item: ExceptionRequestItem; onResubmit: (bookingId: number) => void }) {
    const [expanded, setExpanded] = useState(false);
    const config = STATUS_CONFIG[item.booking_exception_status] ?? STATUS_CONFIG.DRAFT;
    const StatusIcon = config.icon;
    const slotDate = item.booking?.timeSlot?.time_slot_start_datetime;
    const slotEnd = item.booking?.timeSlot?.time_slot_end_datetime;
    const problemName = item.booking?.problemCategory?.problem_category_name_th ?? "ไม่ระบุ";

    return (
        <div className="group rounded-xl border bg-white overflow-hidden transition-all duration-200 hover:shadow-md hover:border-blue-100">
            <div role="button" tabIndex={0} onClick={() => setExpanded(!expanded)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded(!expanded); }}
                className={`relative w-full text-left flex items-center gap-3 px-4 py-3 transition select-none cursor-pointer ${expanded ? "bg-blue-50/30" : "bg-white group-hover:bg-gray-50/50"}`}>
                {slotDate ? (
                    <div className="shrink-0 w-[48px] flex flex-col items-center rounded-lg border bg-white overflow-hidden shadow-sm border-gray-200">
                        <div className="w-full bg-gray-100 text-[9px] font-medium text-gray-500 text-center py-0.5 border-b">
                            {new Date(slotDate).toLocaleDateString("th-TH", { weekday: "short" })}
                        </div>
                        <div className="text-lg font-bold text-gray-800 py-0.5">{new Date(slotDate).getDate()}</div>
                    </div>
                ) : <div className="w-[48px] shrink-0" />}

                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
                            <StatusIcon className="w-3 h-3" /> {config.labelTh}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">#{String(item.booking_id).padStart(6, "0")}</span>
                        {item.evidences.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                <Paperclip className="w-2.5 h-2.5" /> {item.evidences.length}
                            </span>
                        )}
                    </div>
                    <div className="font-medium text-sm text-gray-900 truncate pr-2">
                        {REASON_LABELS[item.booking_exception_reason_code] ?? item.booking_exception_reason_code} — {problemName}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {item.booking_exception_status === "REJECTED" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs border-primary-200 text-primary-700 hover:bg-primary-50 shrink-0"
                            onClick={(e) => { e.stopPropagation(); onResubmit(item.booking_id); }}>
                            <FileText className="w-3 h-3 mr-1" /> ยื่นใหม่
                        </Button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out ${expanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}>
                <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white border rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">วันที่นัดหมาย</p>
                            <p className="text-sm text-gray-700">{formatDate(slotDate)}</p>
                            {slotDate && slotEnd && <p className="text-xs text-gray-500 mt-0.5">{formatTime(slotDate)} – {formatTime(slotEnd)} น.</p>}
                        </div>
                        <div className="bg-white border rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">วันที่ยื่นคำขอ</p>
                            <p className="text-sm text-gray-700">{formatDateTime(item.booking_exception_requested_at)}</p>
                        </div>
                    </div>

                    <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">รายละเอียดเหตุผล</p>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{item.booking_exception_reason_detail}</p>
                    </div>

                    {item.booking_exception_status === "REJECTED" && item.booking_exception_decision_note && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                            <p className="text-xs text-red-600 font-semibold mb-1 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> เหตุผลที่ปฏิเสธ</p>
                            <p className="text-sm text-red-800 leading-relaxed">{item.booking_exception_decision_note}</p>
                        </div>
                    )}

                    {item.booking_exception_status === "APPROVED" && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว</p>
                            {item.booking_exception_decision_note && <p className="text-sm text-emerald-700 mt-1">{item.booking_exception_decision_note}</p>}
                        </div>
                    )}

                    {item.evidences.length > 0 && (
                        <div className="bg-white border rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Paperclip className="w-3 h-3" /> หลักฐาน ({item.evidences.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {item.evidences.map((ev, i) => (
                                    <a key={ev.booking_exception_evidence_id} href={ev.booking_exception_evidence_url}
                                        target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:text-primary-800 underline">
                                        ไฟล์ {i + 1}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ExceptionRequestsPageClient() {
    const { items, penaltyBookings, trustStatus, isLoading, refetch } = useMyExceptionRequests();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const openModal = (bookingId: number) => { setSelectedBookingId(bookingId); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setSelectedBookingId(null); };

    const pending = items.filter((i) => i.booking_exception_status === "PENDING_REVIEW" || i.booking_exception_status === "DRAFT");
    const approved = items.filter((i) => i.booking_exception_status === "APPROVED");
    const rejected = items.filter((i) => i.booking_exception_status === "REJECTED");

    // Client-side date filter
    const filteredPenaltyBookings = penaltyBookings.filter((b) => {
        const slotDate = b.timeSlot?.time_slot_start_datetime;
        if (!slotDate) return true;
        const d = new Date(slotDate);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo) {
            const toEnd = new Date(dateTo);
            toEnd.setDate(toEnd.getDate() + 1);
            if (d >= toEnd) return false;
        }
        return true;
    });

    const canSubmitCount = filteredPenaltyBookings.filter((b) => b.canSubmit).length;
    const hasDateFilter = dateFrom || dateTo;

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingSpinner size="xl" label="กำลังโหลดข้อมูล..." />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        คำขอยกเว้นโทษ
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">จัดการคำขอยกเว้นโทษจากการยกเลิกหรือขาดนัด</p>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs">
                    {pending.length > 0 && <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-medium">รอพิจารณา {pending.length}</span>}
                    {approved.length > 0 && <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">อนุมัติ {approved.length}</span>}
                    {rejected.length > 0 && <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 font-medium">ปฏิเสธ {rejected.length}</span>}
                </div>
            </div>

            {/* Trust Status Banner */}
            {trustStatus && <TrustBanner trust={trustStatus} />}

            {/* ========== Penalty Bookings ========== */}
            <Card className="rounded-2xl shadow-sm border-amber-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b border-amber-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 rounded-xl shadow-sm">
                                <ShieldAlert className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-800">การจองที่ทำให้ถูกลงโทษ</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {canSubmitCount > 0
                                        ? `มี ${canSubmitCount} รายการที่ยังยื่นคำขอได้ (ภายใน 3 วันหลังยกเลิก)`
                                        : "ดูรายละเอียดการจองที่ถูกยกเลิกด้านล่าง"}
                                </p>
                            </div>
                        </div>
                        {penaltyBookings.length > 0 && (
                            <span className="text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full border">
                                {penaltyBookings.length} รายการ
                            </span>
                        )}
                    </div>
                </div>

                {/* Date Filter */}
                {penaltyBookings.length > 0 && (
                    <div className="px-5 py-2.5 border-b border-amber-100 bg-white flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            กรองวันที่:
                        </div>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 focus:ring-1 focus:ring-primary-300 focus:border-primary-300 outline-none"
                        />
                        <span className="text-xs text-gray-400">ถึง</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 focus:ring-1 focus:ring-primary-300 focus:border-primary-300 outline-none"
                        />
                        {hasDateFilter && (
                            <button
                                onClick={() => { setDateFrom(""); setDateTo(""); }}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X className="w-3 h-3" />
                                ล้าง
                            </button>
                        )}
                        <span className="ml-auto text-[11px] text-gray-400">
                            แสดง {filteredPenaltyBookings.length}/{penaltyBookings.length} รายการ
                        </span>
                    </div>
                )}

                <div className="p-4">
                    {filteredPenaltyBookings.length > 0 ? (
                        <div className="space-y-2">
                            {filteredPenaltyBookings.map((b) => (
                                <PenaltyBookingCard key={b.booking_id} b={b} onSubmit={openModal} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="font-medium text-gray-600">
                                {hasDateFilter ? "ไม่พบรายการในช่วงวันที่เลือก" : "ไม่มีรายการที่ถูกลงโทษ"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {hasDateFilter ? "ลองเปลี่ยนช่วงวันที่หรือกดล้างตัวกรอง" : "ท่านยังไม่มีการยกเลิกที่ถูกนับเป็นความผิด"}
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* ========== คำขอที่เคยยื่น ========== */}
            {items.length > 0 && (
                <Card className="rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary-500" />
                            คำขอที่เคยยื่น
                        </h2>
                        <span className="text-xs text-gray-500">{items.length} รายการ</span>
                    </div>
                    <div className="space-y-3">
                        {items.map((item) => (
                            <ExceptionRequestCard key={item.booking_exception_request_id} item={item} onResubmit={openModal} />
                        ))}
                    </div>
                </Card>
            )}

            {/* Modal */}
            <BookingExceptionRequestModal
                isOpen={modalOpen} bookingId={selectedBookingId}
                onClose={closeModal} onSuccess={() => refetch()}
            />
        </div>
    );
}
