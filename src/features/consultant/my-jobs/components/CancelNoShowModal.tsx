"use client";

import React from "react";
import { AlertTriangle, Loader2, Link as LinkIcon } from "lucide-react";
import type { Job } from "../types";

export function CancelNoShowModal({
    open,
    job,
    loading,
    onClose,
    onConfirm,
}: {
    open: boolean;
    job: Job | null;
    loading: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    if (!open || !job) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={!loading ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
                {/* Header Icon Area */}
                <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 ring-4 ring-red-50">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">
                        ยืนยันการยกเลิกเคส
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-[280px]">
                        คุณกำลังปิดเคสนี้เนื่องจากนิสิตไม่มาตามนัด การกระทำนี้ไม่สามารถย้อนกลับได้
                    </p>
                </div>

                {/* Job Details Summary */}
                <div className="px-6 py-4 bg-slate-50/50 border-y border-slate-100">
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">ผู้ขอรับคำปรึกษา:</span>
                            <span className="font-bold text-slate-800">{job.userName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">วันที่-เวลา:</span>
                            <span className="font-semibold text-slate-700">{job.raw?.date ?? "-"} {job.timeRange}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Booking ID:</span>
                            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">#{String(job.id).padStart(6, "0")}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50"
                    >
                        ทบทวนใหม่
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-sm active:scale-[0.98] disabled:opacity-70 flex items-center justify-center disabled:pointer-events-none"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                กำลังยกเลิก...
                            </span>
                        ) : (
                            "ยืนยันยกเลิกเคส"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
