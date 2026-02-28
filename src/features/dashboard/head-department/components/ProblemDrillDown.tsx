// src/features/dashboard/head-department/components/ProblemDrillDown.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal: Top 10 students for a given problem category
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { X, Phone, User, GraduationCap, MapPin, Loader2 } from "lucide-react";

interface DrillDownStudent {
    studentId: number;
    studentCode: string | null;
    fullName: string;
    gender: string | null;
    phone: string | null;
    yearLevel: number;
    facultyName: string;
    departmentName: string;
    province: string | null;
    advisorName: string | null;
    advisorPhone: string | null;
    bookingCount: number;
}

const GENDER_LABEL: Record<string, string> = {
    MALE: "ชาย", FEMALE: "หญิง", LGBTQ_PLUS: "LGBTQ+", OTHER: "อื่นๆ",
};

function formatPhone(phone: string | null): string {
    if (!phone) return "-";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return phone;
}

interface Props {
    categoryName: string | null;
    onClose: () => void;
}

export default function ProblemDrillDown({ categoryName, onClose }: Props) {
    const [students, setStudents] = useState<DrillDownStudent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch data when category changes
    useEffect(() => {
        if (!categoryName) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const sp = new URLSearchParams({ category_name: categoryName, limit: "10" });
                const res = await fetch(`/api/v2/dashboards/head-department/drill-down?${sp}`, {
                    credentials: "include",
                });
                if (cancelled) return;
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "เกิดข้อผิดพลาด");
                setStudents(json.data?.students ?? []);
            } catch (err: any) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [categoryName]);

    // ESC key to close
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (!categoryName) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />

            {/* Modal */}
            <div
                className="relative w-full max-w-5xl max-h-[85vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-[slideUp_0.3s_ease-out]"
                onClick={e => e.stopPropagation()}
            >
                <style>{`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(24px) scale(0.97); }
                        to   { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}</style>

                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-lg font-black text-white">
                            📋 นิสิตที่มาปรึกษา: "{categoryName}"
                        </h2>
                        <p className="text-white/80 text-xs mt-0.5">
                            Top 10 นิสิตที่จองเข้ามาบ่อยที่สุด (เรียงจากมากไปน้อย)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-auto max-h-[calc(85vh-72px)] p-5">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            <p className="text-sm text-slate-400">กำลังโหลดข้อมูลนิสิต...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                                <X className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="text-sm text-red-500 font-bold">เกิดข้อผิดพลาด</p>
                            <p className="text-xs text-slate-400">{error}</p>
                        </div>
                    )}

                    {!loading && !error && students.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                            <User className="w-10 h-10 text-slate-300" />
                            <p className="text-sm text-slate-400">ไม่พบข้อมูลนิสิตในประเภทนี้</p>
                        </div>
                    )}

                    {!loading && !error && students.length > 0 && (
                        <div className="space-y-3">
                            {students.map((s, i) => (
                                <div
                                    key={s.studentId}
                                    className="group bg-white rounded-xl border border-slate-100 hover:border-amber-200 hover:shadow-lg transition-all duration-200 p-4"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Rank Badge */}
                                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${i === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200" :
                                                i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white" :
                                                    i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                                                        "bg-slate-100 text-slate-500"
                                            }`}>
                                            {i + 1}
                                        </div>

                                        {/* Student info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h3 className="text-sm font-bold text-slate-800 truncate">{s.fullName}</h3>
                                                {s.studentCode && (
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                                        {s.studentCode}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${s.gender === "MALE" ? "bg-blue-50 text-blue-600" :
                                                        s.gender === "FEMALE" ? "bg-pink-50 text-pink-600" :
                                                            "bg-purple-50 text-purple-600"
                                                    }`}>
                                                    {GENDER_LABEL[s.gender ?? ""] ?? s.gender ?? "-"}
                                                </span>
                                                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                                                    จอง {s.bookingCount} ครั้ง
                                                </span>
                                            </div>

                                            {/* Detail grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                                    <span className="font-mono text-slate-700">{formatPhone(s.phone)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                                                    <span>ปี {s.yearLevel > 0 ? s.yearLevel : "-"}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="truncate text-slate-700">{s.departmentName}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                    <span className="truncate text-slate-700">{s.province ?? "-"}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <span className="text-slate-400 shrink-0 text-[10px]">คณะ</span>
                                                    <span className="truncate text-slate-700">{s.facultyName}</span>
                                                </div>
                                            </div>

                                            {/* Advisor section */}
                                            {s.advisorName && (
                                                <div className="mt-2 pt-2 border-t border-slate-50">
                                                    <div className="flex items-center gap-3 text-xs">
                                                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">
                                                            อาจารย์ที่ปรึกษา
                                                        </span>
                                                        <span className="text-slate-700 font-medium">{s.advisorName}</span>
                                                        {s.advisorPhone && (
                                                            <span className="flex items-center gap-1 text-slate-500">
                                                                <Phone className="w-3 h-3 text-indigo-400" />
                                                                <span className="font-mono">{formatPhone(s.advisorPhone)}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
