// src/app/(tenant)/(university)/head-consultant/exception-requests/page.tsx
"use client";

import { useMemo, useState } from "react";
import { BookCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ExceptionStatus } from "@prisma/client";
import { useExceptionRequestsQuery } from "@/features/head-consultant/exception-requests/hooks/useExceptionRequestsQuery";
import { ExceptionRequestCard } from "@/features/head-consultant/exception-requests/components/ExceptionRequestCard";

function StatusTab({
    label,
    value,
    current,
    onClick
}: {
    label: string;
    value: ExceptionStatus | "ALL";
    current: string;
    onClick: (s: ExceptionStatus | "ALL") => void;
}) {
    const active = value === current;
    return (
        <button
            onClick={() => onClick(value)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${active
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
        >
            {label}
        </button>
    );
}

export default function HeadConsultantExceptionRequestsPage() {
    const [status, setStatus] = useState<ExceptionStatus | "ALL">("PENDING_REVIEW");

    // NOTE: In a real app we might use server-side pagination state
    const { rows, isLoading, error, refresh } = useExceptionRequestsQuery(status, 1);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BookCheck className="w-6 h-6 text-primary" />
                        คำขอยกเว้นโทษ (Exception Requests)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        จัดการคำขอยกเว้นโทษจากนิสิตที่ยกเลิกกะทันหัน หรือไม่มาตามนัด
                    </p>
                </div>

                <Button variant="outline" onClick={refresh} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    รีเฟรช
                </Button>
            </div>

            <div className="border-b border-gray-200">
                <div className="flex space-x-2">
                    <StatusTab label="รอพิจารณา" value="PENDING_REVIEW" current={status} onClick={setStatus} />
                    <StatusTab label="อนุมัติแล้ว" value="APPROVED" current={status} onClick={setStatus} />
                    <StatusTab label="ปฏิเสธ" value="REJECTED" current={status} onClick={setStatus} />
                    <StatusTab label="ทั้งหมด" value="ALL" current={status} onClick={setStatus} />
                </div>
            </div>

            {error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                    {error}
                </div>
            ) : isLoading && rows.length === 0 ? (
                <div className="flex justify-center items-center py-24">
                    <Spinner size="lg" className="text-primary" />
                </div>
            ) : rows.length === 0 ? (
                <div className="text-center py-24 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                    ไม่มีคำขอยกเว้นโทษที่ตรงกับเงื่อนไข
                </div>
            ) : (
                <div className="space-y-1">
                    {rows.map(req => (
                        <ExceptionRequestCard key={req.booking_exception_request_id} request={req} />
                    ))}
                    {/* Pagination could be added here later */}
                </div>
            )}
        </div>
    );
}
