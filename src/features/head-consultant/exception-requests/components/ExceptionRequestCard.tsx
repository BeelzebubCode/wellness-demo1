// src/features/head-consultant/exception-requests/components/ExceptionRequestCard.tsx
"use client";

import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Calendar, User, FileText, ChevronRight } from "lucide-react";
import type { ExceptionRequestRow } from "../types";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "danger" | "outline" | "success" }> = {
    DRAFT: { label: "ร่างคำขอ", variant: "outline" },
    PENDING_REVIEW: { label: "รอพิจารณา", variant: "default" },
    APPROVED: { label: "อนุมัติ", variant: "success" },
    REJECTED: { label: "ปฏิเสธ", variant: "danger" },
};

export function ExceptionRequestCard({ request }: { request: ExceptionRequestRow }) {
    const reqDate = new Date(request.booking_exception_requested_at);
    const st = statusMap[request.booking_exception_status] || { label: request.booking_exception_status, variant: "outline" };
    const studentProfile = request.student.profile;
    const studentName = studentProfile
        ? `${studentProfile.student_prefix || ''}${studentProfile.student_first_name_th || ''} ${studentProfile.student_last_name_th || ''}`.trim()
        : "ข้อมูลนิสิตไม่สมบูรณ์";

    const slotStart = request.booking.timeSlot?.time_slot_start_datetime
        ? new Date(request.booking.timeSlot.time_slot_start_datetime)
        : null;

    return (
        <Link href={`/head-consultant/exception-requests/${request.booking_exception_request_id}`}>
            <Card className="hover:shadow-md transition-shadow group cursor-pointer mb-3">
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">คำขอ #{request.booking_exception_request_id}</span>
                            <Badge variant={st.variant}>{st.label}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>{studentName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>
                                    นัดหมาย: {slotStart ? format(slotStart, "d MMM yyyy HH:mm", { locale: th }) : "-"}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 md:col-span-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="truncate">เหตุผล: {request.booking_exception_reason_code || "ไม่ระบุ"}</span>
                                <span className="text-gray-400 ml-2">({request.evidences.length} หลักฐาน)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                        <div className="text-xs text-gray-400 mb-1">
                            ยื่นเมื่อ: {format(reqDate, "d MMM yy HH:mm", { locale: th })}
                        </div>
                        <div className="flex items-center text-primary font-medium text-sm group-hover:underline">
                            ดูรายละเอียด <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
