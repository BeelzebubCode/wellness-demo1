"use client";

import { useEffect, useState } from "react";
import { Briefcase, Calendar, MapPin, Clock, LogIn, FileText, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
    ASSIGNED: { label: "มอบหมายแล้ว", bg: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
    COMPLETED: { label: "เสร็จสิ้น", bg: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-500" },
    CANCELLED: { label: "ยกเลิก", bg: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? {
        label: status,
        bg: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${cfg.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}
import { authApi } from "@/features/auth/api";
import { buildTargetHostFromTenantCode } from "@/features/auth/login/login-utils";

type BorrowedAssignment = {
    assignmentId: number;
    borrowRequestId: number;
    title: string;
    reason: string;
    fromUniversityId: number;
    fromUniversityCode: string | null;
    fromUniversityNameTh: string;
    fromUniversityNameEn: string | null;
    startAt: string;
    endAt: string;
    status: string;
    assignedAt: string;
    submittedAt: string | null;
    createdAt: string;
    note: string | null;
    assignedBookings: {
        bookingId: number;
        status: string;
        assignedAt: string;
        problemCategory: string;
        studentName: string;
    }[];
};

export default function ConsultantBorrowedWorkPage() {
    const [assignments, setAssignments] = useState<BorrowedAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [switchingId, setSwitchingId] = useState<number | null>(null);
    const [currentSubdomain, setCurrentSubdomain] = useState<string>("");

    const [homeUniversity, setHomeUniversity] = useState<{ id: number; code: string; name: string } | null>(null);

    useEffect(() => {
        fetchAssignments();
        // ดึง subdomain จาก URL ปัจจุบัน เช่น cu.wellness.local → "CU"
        const hostname = window.location.hostname;
        const parts = hostname.split(".");
        if (parts.length >= 3) {
            setCurrentSubdomain(parts[0].toUpperCase());
        }
    }, []);

    async function fetchAssignments() {
        try {
            setLoading(true);
            const res = await fetch("/api/v2/consultants/me/borrow-requests");
            const json = await res.json();

            if (!json.ok) {
                throw new Error(json.error || "Failed to fetch assignments");
            }

            const data: BorrowedAssignment[] = json.data || [];
            const home = json.homeUniversity || null;
            setAssignments(data);
            if (home) setHomeUniversity(home);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }



    function formatDateTime(isoString: string) {
        const date = new Date(isoString);
        return date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatDateOnly(isoString: string) {
        const date = new Date(isoString);
        return date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    async function handleLoginToUniversity(universityId: number, universityCode: string | null, universityName: string) {
        try {
            setSwitchingId(universityId);
            const result = await authApi.switchTenant(universityId);
            if (!result.success) {
                alert(result.error || "ไม่สามารถเปลี่ยนมหาวิทยาลัยได้");
                return;
            }

            // Build target URL using university code subdomain
            const tenantCode = (universityCode || "").toUpperCase();
            const { protocol, targetHost } = buildTargetHostFromTenantCode(tenantCode);
            const targetPath = "/consultant/my-jobs";
            window.location.assign(`${protocol}//${targetHost}${targetPath}`);
        } catch (err) {
            console.error("Switch tenant error:", err);
            alert("เกิดข้อผิดพลาดในการเข้าสู่ระบบมหาวิทยาลัย");
        } finally {
            setSwitchingId(null);
        }
    }



    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-slate-600">กำลังโหลด...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                        <p className="text-red-700">เกิดข้อผิดพลาด: {error}</p>
                        <Button
                            onClick={fetchAssignments}
                            className="mt-4"
                            variant="outline"
                        >
                            ลองอีกครั้ง
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 bg-gradient-to-br from-white to-blue-50/80 rounded-2xl flex items-center justify-center shadow-lg border border-white/60 shrink-0">
                            <div className="w-7 h-7 icon-tenant rounded-xl flex items-center justify-center">
                                <Briefcase className="w-5 h-5" />
                            </div>
                        </div>

                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                                งานที่รับจากมหาลัยอื่น
                            </h1>
                            <p className="text-sm font-medium text-slate-500 mt-1">
                                รายการคำขอยืมที่ปรึกษาที่คุณได้รับมอบหมาย
                            </p>
                        </div>
                    </div>
                </div>

                {/* Assignments List */}
                {assignments.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            ยังไม่มีงานที่ได้รับมอบหมาย
                        </h3>
                        <p className="text-slate-600">
                            เมื่อมีมหาลัยอื่นขอยืมที่ปรึกษา และคุณได้รับมอบหมาย
                            จะแสดงรายการที่นี่
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4">
                            {assignments.map((assignment) => {
                                const isReady = assignment.status === "ASSIGNED" && currentSubdomain !== (assignment.fromUniversityCode || "").toUpperCase();

                                return (
                                    <Card
                                        key={assignment.assignmentId}
                                        className={cn(
                                            "group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm",
                                            "hover:border-gray-200 hover:shadow-md transition-all cursor-default"
                                        )}
                                    >
                                        <div className="flex flex-col sm:flex-row gap-4 p-5 sm:p-6">
                                            {/* Icon Box */}
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50">
                                                <Briefcase className="h-5 w-5 text-primary-600" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Header */}
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                                                    <div>
                                                        <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-primary-700 transition-colors">
                                                            <span className="text-sm font-medium text-gray-500 mr-1.5">ประเภทปัญหา</span>
                                                            {assignment.title}
                                                        </h3>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                            <span className="inline-flex items-center gap-1.5 font-bold text-gray-800">
                                                                <MapPin className="h-3.5 w-3.5 text-primary-500" />
                                                                {assignment.fromUniversityNameTh}
                                                            </span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                                {formatDateTime(assignment.startAt)} – {formatDateTime(assignment.endAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={assignment.status} />
                                                </div>

                                                {/* Reason */}
                                                {assignment.reason && (
                                                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 border border-gray-100 p-3">
                                                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                                        <div>
                                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">เหตุผลขอยืมตัว</span>
                                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                                {assignment.reason}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Assigned Bookings */}
                                                {assignment.assignedBookings && assignment.assignedBookings.length > 0 && (
                                                    <div className="mt-5">
                                                        <div className="mb-2 flex items-center gap-2">
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                                รายชื่อผู้ขอรับคำปรึกษา ({assignment.assignedBookings.length})
                                                            </span>
                                                        </div>
                                                        <div className="grid sm:grid-cols-2 gap-2">
                                                            {assignment.assignedBookings.map((booking: any) => (
                                                                <div key={booking.bookingId} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                                                            <Users className="h-3.5 w-3.5" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-sm font-bold text-gray-800">{booking.studentName}</p>
                                                                            <p className="truncate text-[10px] text-gray-500">{booking.problemCategory}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className={cn(
                                                                        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                                                                        booking.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                            booking.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                                "bg-gray-50 text-gray-600 border-gray-200"
                                                                    )}>
                                                                        {booking.status}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions Row */}
                                        {isReady && (
                                            <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-5 py-3 sm:px-6">
                                                <span className="text-[11px] text-gray-500">
                                                    งานนี้พร้อมดำเนินการ คุณสามารถเข้าสู่ระบบมหาวิทยาลัยเพื่อเริ่มงานได้ทันที
                                                </span>
                                                <Button
                                                    onClick={() =>
                                                        handleLoginToUniversity(
                                                            assignment.fromUniversityId,
                                                            assignment.fromUniversityCode,
                                                            assignment.fromUniversityNameTh
                                                        )
                                                    }
                                                    disabled={switchingId === assignment.fromUniversityId}
                                                    className="shrink-0 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-xs h-9 px-4"
                                                >
                                                    {switchingId === assignment.fromUniversityId ? (
                                                        "กำลังเข้าสู่ระบบ..."
                                                    ) : (
                                                        <>
                                                            <LogIn className="w-3.5 h-3.5 mr-1.5" />
                                                            ล็อกอินเข้า {assignment.fromUniversityNameTh}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                )
                            })}
                        </div>

                        {/* Summary */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-slate-600">
                                ทั้งหมด{" "}
                                <span className="font-semibold">{assignments.length}</span>{" "}
                                รายการ
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
