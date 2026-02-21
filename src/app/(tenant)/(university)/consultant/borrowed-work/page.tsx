"use client";

import { useEffect, useState } from "react";
import { Briefcase, Calendar, MapPin, Clock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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

    function getStatusBadge(status: string) {
        const variants: Record<string, { variant: any; label: string }> = {
            ASSIGNED: { variant: "default", label: "มอบหมายแล้ว" },
            COMPLETED: { variant: "success", label: "เสร็จสิ้น" },
            CANCELLED: { variant: "destructive", label: "ยกเลิก" },
        };

        const config = variants[status] || { variant: "outline", label: status };
        return (
            <Badge variant={config.variant} className="text-xs">
                {config.label}
            </Badge>
        );
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
                        <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg">
                            <Briefcase className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                งานที่รับจากมหาลัยอื่น
                            </h1>
                            <p className="text-slate-600 mt-1">
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
                        <div className="grid gap-5">
                            {assignments.map((assignment) => (
                                <div
                                    key={assignment.assignmentId}
                                    className="bg-white rounded-3xl shadow-sm border-2 border-slate-200 hover:border-primary-300 hover:shadow-md transition-all overflow-hidden"
                                >
                                    <div className="p-6">
                                        {/* Title & Status */}
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <h3 className="text-2xl font-bold text-slate-900 flex-1">
                                                {assignment.title}
                                            </h3>
                                            {getStatusBadge(assignment.status)}
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                            {/* University */}
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    <MapPin className="w-5 h-5 text-primary-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-0.5">
                                                        มหาวิทยาลัย
                                                    </div>
                                                    <div className="font-semibold text-slate-900">
                                                        {assignment.fromUniversityNameTh}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Time Period */}
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    <Calendar className="w-5 h-5 text-primary-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-0.5">
                                                        ระยะเวลา
                                                    </div>
                                                    <div className="font-semibold text-slate-900">
                                                        {formatDateOnly(assignment.startAt)} -{" "}
                                                        {formatDateOnly(assignment.endAt)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Start Date - Time */}
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    <Calendar className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-0.5">
                                                        เริ่มวันที่ - เวลา
                                                    </div>
                                                    <div className="font-semibold text-slate-900">
                                                        {assignment.startAt ? formatDateTime(assignment.startAt) : "—"}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* End Date - Time */}
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    <Clock className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-0.5">
                                                        ถึงวันที่ - เวลา
                                                    </div>
                                                    <div className="font-semibold text-slate-900">
                                                        {assignment.endAt ? formatDateTime(assignment.endAt) : "—"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                                            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                                เหตุผล
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed">
                                                {assignment.reason}
                                            </p>
                                        </div>

                                        {/* Assigned Bookings List */}
                                        {assignment.assignedBookings && assignment.assignedBookings.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-slate-100">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                                                        <Briefcase className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <h4 className="font-semibold text-slate-800">
                                                        งานที่ได้รับมอบหมาย ({assignment.assignedBookings.length})
                                                    </h4>
                                                </div>

                                                <div className="space-y-3">
                                                    {assignment.assignedBookings.map((booking) => (
                                                        <div
                                                            key={booking.bookingId}
                                                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all"
                                                        >
                                                            <div>
                                                                <div className="font-medium text-slate-900">
                                                                    {booking.studentName}
                                                                </div>
                                                                <div className="text-xs text-slate-500 mt-0.5">
                                                                    {booking.problemCategory} • {formatDateOnly(booking.assignedAt)}
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                variant={
                                                                    booking.status === "COMPLETED" ? "success" :
                                                                        booking.status === "IN_PROGRESS" ? "warning" :
                                                                            booking.status === "ASSIGNED" ? "default" :
                                                                                "outline"
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {booking.status}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {/* ✅ ปุ่ม Login เท่านั้น (auto-complete เมื่อครบกำหนด) */}
                                        {assignment.status === "ASSIGNED" && currentSubdomain !== (assignment.fromUniversityCode || "").toUpperCase() && (
                                            <div className="mt-4 pt-4 border-t border-slate-200">
                                                <Button
                                                    onClick={() =>
                                                        handleLoginToUniversity(
                                                            assignment.fromUniversityId,
                                                            assignment.fromUniversityCode,
                                                            assignment.fromUniversityNameTh
                                                        )
                                                    }
                                                    disabled={switchingId === assignment.fromUniversityId}
                                                    className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-2xl px-6 py-3 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                                                >
                                                    <LogIn className="w-5 h-5" />
                                                    {switchingId === assignment.fromUniversityId
                                                        ? "กำลังเข้าสู่ระบบ..."
                                                        : `เข้าสู่ระบบ ${assignment.fromUniversityNameTh}`}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
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
