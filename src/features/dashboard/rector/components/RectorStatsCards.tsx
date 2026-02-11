"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Users, FileText, ArrowUp, ArrowDown } from "lucide-react";

interface UniversityStats {
    totalStudents: number;
    totalBookings: number;
    activeStudents?: number;
}

export function RectorStatsCards({ stats }: { stats: UniversityStats | null }) {
    if (!stats) return <div className="h-full animate-pulse bg-white/50 rounded-[2rem]" />;

    return (
        <div className="flex flex-col gap-6 h-full font-sans">
            {/* Card 1: Total Students - Indigo Theme */}
            <Card className="flex-1 border-none shadow-sm shadow-blue-gray-100 rounded-[2rem] bg-white hover:shadow-md transition-all duration-300">
                <CardContent className="p-8 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-slate-400 font-sans tracking-wide">
                                จำนวนนิสิตทั้งหมด
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-800 tracking-tight">
                                    {stats.totalStudents.toLocaleString()}
                                </span>
                                <span className="text-sm text-slate-400 font-bold">คน</span>
                            </div>
                        </div>
                        <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl">
                            <Users size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex items-center text-emerald-600 text-xs font-black bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <ArrowUp size={12} className="mr-1 stroke-[3px]" />
                            12.5%
                        </div>
                        <span className="text-xs font-medium text-slate-400">เทียบกับเดือนก่อน</span>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Active Cases - Orange Theme */}
            <Card className="flex-1 border-none shadow-sm shadow-blue-gray-100 rounded-[2rem] bg-white hover:shadow-md transition-all duration-300">
                <CardContent className="p-8 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-slate-400 font-sans tracking-wide">
                                เคสที่ต้องดูแล
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-800 tracking-tight">
                                    {stats.totalBookings.toLocaleString()}
                                </span>
                                <span className="text-sm text-slate-400 font-bold">เคส</span>
                            </div>
                        </div>
                        <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl">
                            <FileText size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex items-center text-rose-500 text-xs font-black bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                            <ArrowDown size={12} className="mr-1 stroke-[3px]" />
                            2.1%
                        </div>
                        <span className="text-xs font-medium text-slate-400">อัตราการปิดเคสลดลง</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
