// src/features/consultant/my-jobs/components/AttendancePanel.tsx
"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { markAttendance } from "../api/myJobs";

export function AttendancePanel({
    bookingId,
    currentStatus,
    onSuccess
}: {
    bookingId: number;
    currentStatus?: string | null;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [lateMinutes, setLateMinutes] = useState("");
    const [note, setNote] = useState("");

    const handleMark = async (type: "CHECKED_IN" | "LATE" | "NO_SHOW") => {
        if (type === "LATE" && !lateMinutes) {
            alert("กรุณาระบุจำนวนนาทีที่มาสาย");
            return;
        }
        setLoading(true);
        try {
            await markAttendance(bookingId, type, type === "LATE" ? parseInt(lateMinutes) : undefined, note);
            onSuccess();
        } catch (e: any) {
            alert(e.message ?? "บันทึกการเข้าพบไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    if (currentStatus) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 shadow-sm flex items-start gap-3">
                {currentStatus === "CHECKED_IN" && <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />}
                {currentStatus === "LATE" && <Clock className="w-5 h-5 text-amber-500 mt-0.5" />}
                {currentStatus === "NO_SHOW" && <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />}

                <div>
                    <p className="font-semibold text-sm text-gray-800">
                        สถานะการเข้าพบ: <span className="text-gray-900">{currentStatus}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">ถูกบันทึกเรียบร้อยแล้ว</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-4 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                บันทึกการเข้าพบ (Attendance)
            </h4>

            <div className="space-y-4">
                {/* Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                        onClick={() => handleMark("CHECKED_IN")}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-xs transition-colors disabled:opacity-50"
                    >
                        <CheckCircle2 className="w-5 h-5 mb-1" />
                        เข้าพบตรงเวลา
                    </button>

                    <button
                        onClick={() => handleMark("LATE")}
                        disabled={loading || !lateMinutes}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs transition-colors disabled:opacity-50"
                    >
                        <Clock className="w-5 h-5 mb-1" />
                        มาสาย (Late)
                    </button>

                    <button
                        onClick={() => {
                            if (confirm("ยืนยันบันทึก No Show? การกระทำนี้จะส่งผลให้ระบบหักคะแนนผู้รับบริการโดยอัตโนมัติ")) {
                                handleMark("NO_SHOW");
                            }
                        }}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors disabled:opacity-50"
                    >
                        <AlertCircle className="w-5 h-5 mb-1" />
                        ไม่มาตามนัด (No Show)
                    </button>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">เวลาที่มาสาย (นาที)</label>
                        <input
                            type="number"
                            min="1"
                            value={lateMinutes}
                            onChange={e => setLateMinutes(e.target.value)}
                            placeholder="ระบุตัวเลข (เช่น 15)"
                            className="w-full text-sm border-gray-200 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">หมายเหตุเพิ่มเติม</label>
                        <input
                            type="text"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="เช่น ติดปัญหาขัดข้อง..."
                            className="w-full text-sm border-gray-200 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                            disabled={loading}
                        />
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center mt-2 text-xs text-gray-500 font-medium pb-1">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" /> กำลังบันทึกข้อมูล...
                    </div>
                )}
            </div>
        </div>
    );
}
