// src/app/(tenant)/(university)/head-consultant/exception-requests/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    ChevronLeft, FileText, CheckCircle2, XCircle,
    ExternalLink, Clock, AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";


import { useExceptionRequestDetail } from "@/features/head-consultant/exception-requests/hooks/useExceptionRequestDetail";
import { useExceptionReview } from "@/features/head-consultant/exception-requests/hooks/useExceptionReview";

const statusLabelMap: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "ร่างคำขอ", cls: "bg-gray-100 text-gray-700" },
    PENDING_REVIEW: { label: "รอพิจารณา", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    APPROVED: { label: "อนุมัติ", cls: "bg-green-50 text-green-700 border-green-200" },
    REJECTED: { label: "ปฏิเสธ", cls: "bg-red-50 text-red-700 border-red-200" },
};

export default function ExceptionRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
    const requestId = parseInt(idStr || "0", 10);

    const { data: request, isLoading, error, refresh } = useExceptionRequestDetail(requestId);

    const [decisionNote, setDecisionNote] = useState("");
    const { doReview, isSubmitting } = useExceptionReview(() => {
        refresh(); // Refresh data after success
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Spinner size="lg" className="text-primary" />
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="max-w-4xl mx-auto space-y-4">
                <Button variant="outline" onClick={() => router.back()}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> กลับ
                </Button>
                <Card className="p-6 bg-red-50 border-red-200 text-red-700 text-center">
                    {error || "ไม่พบข้อมูลคำขอ"}
                </Card>
            </div>
        );
    }

    const st = statusLabelMap[request.booking_exception_status] || statusLabelMap.DRAFT;
    const student = request.student;
    const isPending = request.booking_exception_status === "PENDING_REVIEW";

    const slotStart = request.booking.timeSlot?.time_slot_start_datetime
        ? new Date(request.booking.timeSlot.time_slot_start_datetime)
        : null;

    const handleApprove = async () => {
        if (!confirm("ยืนยันการอนุมัติยกเว้นโทษ?\n(ระบบจะคืนแต้มและปลดล็อกนิสิตโดยอัตโนมัติ)")) return;
        await doReview(requestId, "APPROVE", decisionNote);
    };

    const handleReject = async () => {
        if (!decisionNote.trim()) {
            alert("กรุณาระบุเหตุผลในการปฏิเสธ");
            return;
        }
        if (!confirm("ยืนยันการปฏิเสธคำขอ?")) return;
        await doReview(requestId, "REJECT", decisionNote);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">คำขอยกเว้นโทษ #{requestId}</h1>
                        <Badge className={st.cls}>{st.label}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        ยื่นเมื่อ: {format(new Date(request.booking_exception_requested_at), "d MMM yyyy HH:mm", { locale: th })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* เลนซ้าย: รายละเอียดคำขอ */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold border-b pb-3 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            รายละเอียดคำขอ
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">เหตุผลที่ระบุ</div>
                                <div className="font-medium text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-100">
                                    {request.booking_exception_reason_code}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500 mb-1">รายละเอียดเพิ่มเติม</div>
                                <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-100 min-h-[100px]">
                                    {request.booking_exception_reason_detail}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500 mb-2 flex items-center justify-between">
                                    <span>เอกสารหลักฐาน ({request.evidences.length})</span>
                                </div>
                                {request.evidences.length === 0 ? (
                                    <div className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-md border border-dashed border-gray-200">
                                        ไม่มีหลักฐานแนบ
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {request.evidences.map((e, idx) => (
                                            <li key={e.booking_exception_evidence_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                                        <FileText className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="text-sm font-medium truncate">
                                                        {e.booking_exception_evidence_name || `หลักฐานชิ้นที่ ${idx + 1}`}
                                                    </span>
                                                </div>
                                                <a
                                                    href={e.booking_exception_evidence_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1 text-xs text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full whitespace-nowrap"
                                                >
                                                    เปิดดู <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Action Box สำหรับพิจารณา */}
                    {isPending && (
                        <Card className="p-6 border-blue-200 shadow-sm">
                            <h2 className="text-lg font-semibold mb-2">พิจารณาคำขอ</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                กรุณาระบุความคิดเห็นและเลือกดำเนินการ ระบบจะทำการปลดล็อกและคืนแต้มให้อัตโนมัติหากกดอนุมัติ
                            </p>

                            <div className="space-y-4">
                                <textarea
                                    className="w-full min-h-[100px] border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="บันทึกความเห็นการพิจารณา (จำเป็นต้องกรอกหากปฏิเสธ)"
                                    rows={3}
                                    value={decisionNote}
                                    onChange={(e) => setDecisionNote(e.target.value)}
                                    disabled={isSubmitting}
                                />

                                <div className="flex gap-3 justify-end pt-2">
                                    <Button
                                        variant="destructive"
                                        onClick={handleReject}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        ปฏิเสธคำขอ
                                    </Button>
                                    <Button
                                        onClick={handleApprove}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        อนุมัติคำขอ (คืนแต้ม/ปลดล็อก)
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* กล่องแสดงผลลัพธ์ (กรณียกเลิก/พิจารณาไปแล้ว) */}
                    {!isPending && request.booking_exception_status !== "DRAFT" && (
                        <Card className={`p-6 border-l-4 ${request.booking_exception_status === 'APPROVED' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                            <h3 className="font-semibold mb-4">ผลการพิจารณา</h3>
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                                    <span className="text-gray-500">ผลลัพธ์:</span>
                                    <span className={`col-span-2 font-medium ${request.booking_exception_status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                                        {st.label}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                                    <span className="text-gray-500">ผู้พิจารณา:</span>
                                    <span className="col-span-2 font-medium">
                                        {request.reviewedBy?.account_username || "ไม่ระบุ"}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                                    <span className="text-gray-500">วันที่พิจารณา:</span>
                                    <span className="col-span-2">
                                        {request.booking_exception_reviewed_at
                                            ? format(new Date(request.booking_exception_reviewed_at), "d MMM yyyy HH:mm", { locale: th })
                                            : "-"}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 py-2 pt-2">
                                    <span className="text-gray-500">บันทึกความเห็น:</span>
                                    <span className="col-span-2 whitespace-pre-wrap">
                                        {request.booking_exception_decision_note || "-"}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* เลนขวา: ข้อมูลประกอบ (นิสิต, นัดหมาย) */}
                <div className="space-y-6">
                    <Card className="p-5">
                        <h3 className="font-semibold mb-4 pb-2 border-b text-gray-800">ข้อมูลนิสิต</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">รหัสนิสิต:</span>
                                <span className="font-medium text-gray-900">{request.student_id || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">ชื่อ-สกุล:</span>
                                <span className="font-medium text-gray-900">
                                    {student.profile ? `${student.profile.student_prefix || ''}${student.profile.student_first_name_th || ''} ${student.profile.student_last_name_th || ''}` : '-'}
                                </span>
                            </div>

                            <div className="pt-3 mt-3 border-t">
                                <p className="text-gray-500 mb-2">ประวัติคะแนนความน่าเชื่อถือ</p>

                                <div className="bg-orange-50 rounded-md p-3 border border-orange-100 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-orange-700">ยกเลิกสายสะสม:</span>
                                        <span className="font-semibold font-mono">{student.trustStatus?.student_trust_late_cancel_count ?? 0} ครั้ง</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-orange-700">No Show สะสม:</span>
                                        <span className="font-semibold font-mono">{student.trustStatus?.student_trust_no_show_count ?? 0} ครั้ง</span>
                                    </div>

                                    {student.trustStatus?.student_trust_locked_until && new Date(student.trustStatus.student_trust_locked_until) > new Date() && (
                                        <div className="mt-2 pt-2 border-t border-orange-200 flex items-start gap-1.5 text-red-600 text-xs font-medium">
                                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
                                            <div>
                                                ถูกระงับสิทธิ์การจองถึง<br />
                                                {format(new Date(student.trustStatus.student_trust_locked_until), "d MMM yy HH:mm", { locale: th })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5">
                        <h3 className="font-semibold mb-4 pb-2 border-b text-gray-800">ข้อมูลนัดหมายเดิม</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">รหัสจอง:</span>
                                <Link href={`/head-consultant/bookings?search=${request.booking_id}`} className="font-medium text-primary hover:underline">
                                    #{request.booking_id}
                                </Link>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">ประเภทปัญหา:</span>
                                <span className="text-gray-900 text-right">{request.booking.problemCategory?.problem_category_name || '-'}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-gray-500">เวลานัด:</span>
                                <span className="text-gray-900 text-right">
                                    {slotStart ? format(slotStart, "d MMM yyyy\nHH:mm", { locale: th }) : "-"}
                                </span>
                            </div>

                            <div className="pt-3 mt-3 border-t">
                                <p className="text-gray-500 mb-2">ข้อมูลการยกเลิก/เข้าพบ</p>
                                <div className="bg-gray-50 rounded-md p-3 border border-gray-100 space-y-2">
                                    {request.booking.cancellation && (
                                        <>
                                            <div className="text-xs font-semibold text-red-600 mb-1">ถูกยกเลิก (Canceled)</div>
                                            <div className="text-xs text-gray-600">
                                                {format(new Date(request.booking.cancellation.booking_cancellation_cancelled_at), "d MMM yy HH:mm", { locale: th })}
                                            </div>
                                            <div className="text-xs text-gray-700 mt-1">
                                                เหตุผล: {request.booking.cancellation.cancellationReason?.cancellation_reason_name}
                                            </div>
                                        </>
                                    )}
                                    {request.booking.attendance?.booking_attendance_status === "NO_SHOW" && (
                                        <div className="text-xs font-semibold text-red-600">
                                            ถูกบันทึกการขาดนัด (No Show)
                                        </div>
                                    )}
                                    {!request.booking.cancellation && request.booking.attendance?.booking_attendance_status !== "NO_SHOW" && (
                                        <div className="text-xs text-gray-500 italic">ไม่มีข้อมูลการยกเลิกหรือ No Show</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
