// features/dashboard/head-consultant/components/ConsultantHistoryView.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    ArrowLeft,
    Calendar as CalendarIcon,
    User,
    Tag,
    FileText,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Filter,
    Search
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { cn } from "@/lib/cn";
import type { TeamMember } from "../hooks/useHeadConsultantDashboard";
import { getConsultantHistory } from "../actions";

interface ConsultantHistoryViewProps {
    member: TeamMember;
    onBack: () => void;
}

const ITEMS_PER_PAGE = 8;

export function ConsultantHistoryView({ member, onBack }: ConsultantHistoryViewProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>();

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const result = await getConsultantHistory(member.consultantId, {
                    from: dateRange?.from?.toISOString(),
                    to: dateRange?.to?.toISOString(),
                    skip: (currentPage - 1) * ITEMS_PER_PAGE,
                    take: ITEMS_PER_PAGE
                });
                setHistory(result.items);
                setTotal(result.total);
            } catch (err) {
                console.error("Failed to fetch consultant history:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [member.consultantId, currentPage, dateRange]);

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            {/* ── Top Actions ─────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="group hover:bg-slate-100 rounded-xl px-3 w-fit"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">กลับไปที่รายชื่อทีม</span>
                </Button>

                <div className="flex items-center gap-3">
                    <DateRangePicker
                        startDate={dateRange?.from}
                        endDate={dateRange?.to}
                        onChange={(range) => {
                            setDateRange(range);
                            setCurrentPage(1); // Reset page on filter
                        }}
                    />
                    {(dateRange?.from || dateRange?.to) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDateRange(undefined)}
                            className="text-slate-400 hover:text-red-500 font-bold text-xs"
                        >
                            ล้างกรอง
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Profile Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-6">
                        <div className="h-16 bg-gradient-to-r from-primary-500 to-indigo-600" />
                        <CardContent className="p-6 -mt-8">
                            <div className="flex flex-col items-center text-center">
                                <div className="h-16 w-16 rounded-2xl bg-white p-1 shadow-lg border-2 border-white">
                                    <div className="h-full w-full rounded-xl bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                                        {member.firstName.charAt(0)}
                                    </div>
                                </div>
                                <h3 className="mt-3 text-lg font-bold text-slate-900 leading-tight">
                                    {member.prefix}{member.firstName} {member.lastName}
                                </h3>

                                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                                    {member.specializations.map((spec, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-200">
                                            {spec}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-6 w-full border-t border-slate-100 pt-5 space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">เคสทั้งหมด</span>
                                        <span className="text-sm font-black text-slate-900">{total}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">เรตติ้งเฉลี่ย</span>
                                        <div className="flex items-center gap-1 text-sm font-black text-amber-500">
                                            {member.avgRating.toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Improved Table-style List */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-400 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">นิสิต (Student)</th>
                                        <th className="px-6 py-4">ประเภทปัญหา</th>
                                        <th className="px-6 py-4">วันที่ / เวลา</th>
                                        <th className="px-6 py-4">สถานะ</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <LoadingSpinner />
                                            </td>
                                        </tr>
                                    ) : history.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">
                                                ไม่พบข้อมูลในช่วงเวลาที่เลือก
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((booking) => (
                                            <tr key={booking.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3 min-w-[200px]">
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                                            {booking.studentName.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700 truncate">{booking.studentName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[11px] font-black border border-indigo-100">
                                                        <Tag className="h-3 w-3" />
                                                        {booking.problemType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-bold text-slate-700">
                                                            {new Date(booking.date).toLocaleDateString('th-TH', {
                                                                day: '2-digit', month: 'short', year: '2-digit'
                                                            })}
                                                        </p>
                                                        <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                                            <CalendarIcon className="h-3 w-3" />
                                                            {booking.startTime} - {booking.endTime}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-tight border",
                                                        booking.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                            booking.status === "CANCELLED" ? "bg-red-50 text-red-600 border-red-100" :
                                                                "bg-blue-50 text-blue-600 border-blue-100"
                                                    )}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {booking.outcomeNote && (
                                                        <div className="group/note relative">
                                                            <FileText className="h-4 w-4 text-slate-300 hover:text-primary-500 cursor-help transition-colors" />
                                                            <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover/note:opacity-100 transition-opacity z-10 pointer-events-none shadow-xl border border-white/10 italic leading-relaxed">
                                                                <div className="font-black not-italic mb-1 uppercase tracking-widest text-[8px] text-slate-400">Consultant Note</div>
                                                                "{booking.outcomeNote}"
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-2 py-4">
                            <p className="text-xs text-slate-500 font-medium">
                                Showing <span className="font-black">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-black">{Math.min(currentPage * ITEMS_PER_PAGE, total)}</span> of <span className="font-black">{total}</span>
                            </p>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="h-8 w-8 rounded-lg border-slate-200"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                                    // Only show first, last, and around current page
                                    if (totalPages > 5 && p > 1 && p < totalPages && Math.abs(p - currentPage) > 1) {
                                        if (p === 2 || p === totalPages - 1) return <span key={p} className="px-1 text-slate-300">...</span>;
                                        return null;
                                    }

                                    return (
                                        <Button
                                            key={p}
                                            variant={currentPage === p ? "primary" : "outline"}
                                            onClick={() => setCurrentPage(p)}
                                            className={cn(
                                                "h-8 w-8 rounded-lg text-xs font-black p-0",
                                                currentPage === p ? "shadow-lg shadow-primary-200" : "text-slate-600"
                                            )}
                                        >
                                            {p}
                                        </Button>
                                    );
                                })}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="h-8 w-8 rounded-lg border-slate-200"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
