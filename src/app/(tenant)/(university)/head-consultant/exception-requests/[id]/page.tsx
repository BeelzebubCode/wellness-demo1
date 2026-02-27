// src/app/(tenant)/(university)/head-consultant/exception-requests/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    ChevronLeft, FileText, CheckCircle2, XCircle, ExternalLink,
    Clock, AlertTriangle, User, CalendarDays, ShieldAlert,
    Paperclip, MessageSquare, Scale, Ban,
} from "lucide-react";

import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import { useExceptionRequestDetail } from "@/features/head-consultant/exception-requests/hooks/useExceptionRequestDetail";
import { useExceptionReview } from "@/features/head-consultant/exception-requests/hooks/useExceptionReview";

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, {
    label: string; icon: typeof Clock;
    bg: string; text: string; border: string; glow: string;
    headerBg: string;
}> = {
    DRAFT: {
        label: "ร่างคำขอ", icon: FileText,
        bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", glow: "",
        headerBg: "from-gray-50 to-gray-100/40",
    },
    PENDING_REVIEW: {
        label: "รอพิจารณา", icon: Clock,
        bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", glow: "ring-2 ring-amber-100",
        headerBg: "from-amber-50 to-orange-50/40",
    },
    APPROVED: {
        label: "อนุมัติแล้ว", icon: CheckCircle2,
        bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", glow: "",
        headerBg: "from-emerald-50 to-green-50/40",
    },
    REJECTED: {
        label: "ปฏิเสธ", icon: XCircle,
        bg: "bg-red-50", text: "text-red-700", border: "border-red-200", glow: "",
        headerBg: "from-red-50 to-rose-50/40",
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, children }: { label: string; value?: React.ReactNode; children?: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5">
            <span className="text-xs text-gray-400 font-medium shrink-0 mt-0.5">{label}</span>
            <span className="text-sm font-semibold text-gray-800 text-right">{children ?? value ?? "–"}</span>
        </div>
    );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">{children}</h3>
        </div>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ExceptionRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
    const requestId = parseInt(idStr || "0", 10);

    const { data: request, isLoading, error, refresh } = useExceptionRequestDetail(requestId);
    const [decisionNote, setDecisionNote] = useState("");
    const [confirmAction, setConfirmAction] = useState<"APPROVE" | "REJECT" | null>(null);
    const { doReview, isSubmitting } = useExceptionReview(() => refresh());
    const { warning: toastWarning } = useToast();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Spinner size="lg" className="text-primary" />
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="max-w-6xl mx-auto space-y-4 py-10 px-4">
                <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
                    <ChevronLeft className="w-4 h-4" /> กลับ
                </button>
                <div className="p-8 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center">
                    {error || "ไม่พบข้อมูลคำขอ"}
                </div>
            </div>
        );
    }

    const st = STATUS_CFG[request.booking_exception_status] || STATUS_CFG.DRAFT;
    const StatusIcon = st.icon;
    const student = request.student;
    const isPending = request.booking_exception_status === "PENDING_REVIEW";

    const studentName = student.profile
        ? `${student.profile.student_prefix || ""}${student.profile.student_first_name_th || ""} ${student.profile.student_last_name_th || ""}`.trim()
        : "ข้อมูลนิสิตไม่สมบูรณ์";

    const slotStart = request.booking.timeSlot?.time_slot_start_datetime
        ? new Date(request.booking.timeSlot.time_slot_start_datetime) : null;
    const slotEnd = request.booking.timeSlot?.time_slot_end_datetime
        ? new Date(request.booking.timeSlot.time_slot_end_datetime) : null;

    const lateCancel = student.behaviorStatus?.student_trust_late_cancel_count ?? 0;
    const noShow = student.behaviorStatus?.student_trust_no_show_count ?? 0;
    const isLocked = student.behaviorStatus?.student_trust_locked_until
        && new Date(student.behaviorStatus.student_trust_locked_until) > new Date();

    const handleApprove = async () => {
        if (confirmAction !== "APPROVE") { setConfirmAction("APPROVE"); return; }
        setConfirmAction(null);
        await doReview(requestId, "APPROVE", decisionNote);
    };

    const handleReject = async () => {
        if (!decisionNote.trim()) { toastWarning("กรุณาระบุเหตุผลในการปฏิเสธ"); return; }
        if (confirmAction !== "REJECT") { setConfirmAction("REJECT"); return; }
        setConfirmAction(null);
        await doReview(requestId, "REJECT", decisionNote);
    };

    return (
        <div className="max-w-6xl mx-auto pb-16 space-y-5 px-4 xl:px-0">
            {/* ── Breadcrumb ── */}
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors font-medium"
            >
                <ChevronLeft className="w-4 h-4" /> กลับหน้ารายการ
            </button>

            {/* ── Header card ── */}
            <div className={`rounded-2xl border ${st.border} bg-gradient-to-r ${st.headerBg} p-5 lg:p-6 ${st.glow}`}>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/90 border border-white shadow-sm flex flex-col items-center justify-center shrink-0">
                        <span className="text-[8px] text-gray-400 font-medium leading-none">คำขอ</span>
                        <span className="text-lg font-black text-slate-700">#{requestId}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-xl font-bold text-slate-800">คำขอยกเว้นโทษ</h1>
                            <span className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1 ${st.bg} ${st.text} border ${st.border}`}>
                                <StatusIcon className="w-3.5 h-3.5" /> {st.label}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            ยื่นเมื่อ {format(new Date(request.booking_exception_requested_at), "d MMM yyyy เวลา HH:mm น.", { locale: th })}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Two-column layout: Left (main) + Right (sidebar) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* ── LEFT: 3 of 5 columns ── */}
                <div className="lg:col-span-3 space-y-5">
                    {/* Reason + Evidence */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-6 space-y-5">
                        <SectionTitle icon={MessageSquare}>รายละเอียดคำขอ</SectionTitle>

                        {/* Reason code */}
                        <div>
                            <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">เหตุผลที่ระบุ</label>
                            <div className="text-base font-bold text-slate-800 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                                {request.exceptionReason?.exception_reason_name_th || request.booking_exception_reason_code}
                            </div>
                        </div>

                        {/* Detail */}
                        <div>
                            <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">รายละเอียดเพิ่มเติม</label>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl px-4 py-4 border border-gray-100 leading-relaxed min-h-[80px]">
                                {request.booking_exception_reason_detail || "ไม่มีรายละเอียดเพิ่มเติม"}
                            </div>
                        </div>

                        {/* Evidence */}
                        <div>
                            <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5 block">
                                <Paperclip className="w-3.5 h-3.5" /> เอกสารหลักฐาน ({request.evidences.length})
                            </label>
                            {request.evidences.length === 0 ? (
                                <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 text-center">
                                    ไม่มีหลักฐานแนบ
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {request.evidences.map((e, idx) => (
                                        <a
                                            key={e.booking_exception_evidence_id}
                                            href={e.booking_exception_evidence_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                                <FileText className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium text-gray-700 truncate block group-hover:text-primary transition-colors">
                                                    {e.booking_exception_evidence_name || `หลักฐานชิ้นที่ ${idx + 1}`}
                                                </span>
                                                {e.booking_exception_evidence_type && (
                                                    <span className="text-[10px] text-gray-400 uppercase">{e.booking_exception_evidence_type}</span>
                                                )}
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-primary shrink-0 transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Decision box (PENDING) ── */}
                    {isPending && (
                        <div className="bg-white rounded-2xl border-2 border-primary/20 p-5 lg:p-6 shadow-sm">
                            <SectionTitle icon={Scale}>พิจารณาคำขอ</SectionTitle>
                            <p className="text-xs text-gray-400 mb-4 -mt-2">
                                ระบุความคิดเห็น → เลือกอนุมัติหรือปฏิเสธ (ระบบจะคืนแต้มและปลดล็อกอัตโนมัติหากอนุมัติ)
                            </p>

                            <textarea
                                className="w-full min-h-[100px] text-sm border border-gray-200 rounded-xl p-4 bg-gray-50/50
                                           focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white
                                           transition-all duration-150 placeholder:text-gray-300 resize-none"
                                placeholder="บันทึกความเห็นการพิจารณา (จำเป็นต้องกรอกหากปฏิเสธ)..."
                                rows={4}
                                value={decisionNote}
                                onChange={(e) => setDecisionNote(e.target.value)}
                                disabled={isSubmitting}
                            />

                            {/* Inline confirmation bar */}
                            {confirmAction && (
                                <div className={`flex items-center gap-3 p-3 rounded-xl border mt-4 ${confirmAction === "APPROVE"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                    : "bg-red-50 border-red-200 text-red-800"
                                    }`}>
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span className="flex-1 text-sm font-medium">
                                        {confirmAction === "APPROVE"
                                            ? "ยืนยันอนุมัติ? ระบบจะคืนแต้มและปลดล็อกนิสิตโดยอัตโนมัติ"
                                            : "ยืนยันปฏิเสธคำขอนี้?"
                                        }
                                    </span>
                                    <button
                                        onClick={() => setConfirmAction(null)}
                                        className="px-3 py-1 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        onClick={confirmAction === "APPROVE" ? handleApprove : handleReject}
                                        disabled={isSubmitting}
                                        className={`px-3 py-1 text-xs font-bold rounded-lg text-white disabled:opacity-50 ${confirmAction === "APPROVE"
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "bg-red-600 hover:bg-red-700"
                                            }`}
                                    >
                                        {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยัน"}
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
                                <button
                                    onClick={handleReject}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-red-600 bg-red-50 border border-red-200
                                               rounded-xl hover:bg-red-100 transition-all duration-150 active:scale-[0.98] disabled:opacity-50
                                               w-full sm:w-auto"
                                >
                                    <XCircle className="w-4 h-4" /> ปฏิเสธคำขอ
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600
                                               rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200
                                               transition-all duration-150 active:scale-[0.98] disabled:opacity-50
                                               w-full sm:w-auto"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> อนุมัติ (คืนแต้ม/ปลดล็อก)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Review result (APPROVED / REJECTED) ── */}
                    {!isPending && request.booking_exception_status !== "DRAFT" && (
                        <div className={`rounded-2xl border p-5 lg:p-6 ${request.booking_exception_status === "APPROVED"
                            ? "bg-emerald-50/50 border-emerald-200"
                            : "bg-red-50/50 border-red-200"
                            }`}>
                            <SectionTitle icon={request.booking_exception_status === "APPROVED" ? CheckCircle2 : XCircle}>
                                ผลการพิจารณา
                            </SectionTitle>

                            <div className="divide-y divide-gray-100/80">
                                <InfoRow label="ผลลัพธ์">
                                    <span className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1 ${st.bg} ${st.text} border ${st.border}`}>
                                        <StatusIcon className="w-3.5 h-3.5" /> {st.label}
                                    </span>
                                </InfoRow>
                                <InfoRow label="ผู้พิจารณา" value={request.reviewedBy?.account_username || "–"} />
                                <InfoRow label="วันที่พิจารณา" value={
                                    request.booking_exception_reviewed_at
                                        ? format(new Date(request.booking_exception_reviewed_at), "d MMM yyyy HH:mm น.", { locale: th })
                                        : "–"
                                } />
                            </div>

                            {request.booking_exception_decision_note && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">ความเห็น</label>
                                    <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white/80 rounded-xl px-4 py-3 border border-gray-100 leading-relaxed">
                                        {request.booking_exception_decision_note}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT SIDEBAR: 2 of 5 columns ── */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Student card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-6">
                        <SectionTitle icon={User}>ข้อมูลนิสิต</SectionTitle>

                        <div className="divide-y divide-gray-50">
                            <InfoRow label="รหัสนิสิต" value={request.student_id || "–"} />
                            <InfoRow label="ชื่อ-สกุล" value={studentName} />
                        </div>

                        {/* Behavior stats */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className={`rounded-xl p-4 text-center border ${lateCancel > 0 ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"}`}>
                                <div className={`text-2xl font-black tabular-nums ${lateCancel > 0 ? "text-amber-600" : "text-gray-300"}`}>
                                    {lateCancel}
                                </div>
                                <div className="text-[10px] text-gray-500 font-semibold mt-1">ยกเลิกสาย</div>
                            </div>
                            <div className={`rounded-xl p-4 text-center border ${noShow > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                                <div className={`text-2xl font-black tabular-nums ${noShow > 0 ? "text-red-600" : "text-gray-300"}`}>
                                    {noShow}
                                </div>
                                <div className="text-[10px] text-gray-500 font-semibold mt-1">No-Show</div>
                            </div>
                        </div>

                        {isLocked && (
                            <div className="mt-3 flex items-start gap-2 text-xs text-red-600 font-semibold bg-red-50 rounded-xl p-3 border border-red-100">
                                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                    ถูกระงับสิทธิ์การจองถึง {format(new Date(student.behaviorStatus!.student_trust_locked_until!), "d MMM yy HH:mm", { locale: th })}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Booking card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-6">
                        <SectionTitle icon={CalendarDays}>ข้อมูลนัดหมาย</SectionTitle>

                        <div className="divide-y divide-gray-50">
                            <InfoRow label="รหัสจอง">
                                <Link href={`/head-consultant/bookings?search=${request.booking_id}`} className="text-primary hover:underline font-mono text-sm">
                                    #{request.booking_id}
                                </Link>
                            </InfoRow>
                            <InfoRow label="ประเภทปัญหา" value={request.booking.problemCategory?.problem_category_name || "–"} />
                            <InfoRow label="นัดหมาย">
                                {slotStart ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                                        <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                                        {format(slotStart, "d MMM yy HH:mm", { locale: th })}
                                        {slotEnd && <>–{format(slotEnd, "HH:mm")}</>}
                                    </span>
                                ) : "–"}
                            </InfoRow>
                        </div>

                        {/* Cancellation / No-Show info */}
                        {(request.booking.cancellation || request.booking.attendance?.booking_attendance_status === "NO_SHOW") && (
                            <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-3 space-y-1.5">
                                {request.booking.cancellation && (
                                    <>
                                        <div className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                                            <Ban className="w-3.5 h-3.5" /> ยกเลิกเมื่อ {format(new Date(request.booking.cancellation.booking_cancellation_cancelled_at), "d MMM yy HH:mm", { locale: th })}
                                        </div>
                                        {request.booking.cancellation.cancellationReason && (
                                            <div className="text-xs text-red-500 pl-5">
                                                เหตุผล: {request.booking.cancellation.cancellationReason.cancellation_reason_name}
                                            </div>
                                        )}
                                    </>
                                )}
                                {request.booking.attendance?.booking_attendance_status === "NO_SHOW" && (
                                    <div className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5" /> ถูกบันทึก No-Show
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
