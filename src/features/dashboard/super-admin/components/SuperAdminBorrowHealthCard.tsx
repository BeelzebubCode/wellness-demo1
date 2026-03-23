// SuperAdminBorrowHealthCard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { ChartCard } from "../../widgets/cards/ChartCard";
import { getBorrowSystemHealth } from "../actions";
import { Clock, XCircle, CheckCircle2, Activity } from "lucide-react";

type HealthData = {
    avgApprovalDays: number;
    avgRejectionDays: number;
    rejectionRate: number;
    totalProcessed: number;
    approvedCount: number;
    rejectedCount: number;
};

export function SuperAdminBorrowHealthCard() {
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBorrowSystemHealth()
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    const getRateColor = (rate: number) => {
        if (rate <= 15) return "text-emerald-600";
        if (rate <= 30) return "text-amber-600";
        return "text-red-600";
    };

    const getSpeedLabel = (days: number) => {
        if (days <= 1) return { label: "เร็วมาก", color: "text-emerald-600" };
        if (days <= 3) return { label: "ปกติ", color: "text-blue-600" };
        if (days <= 7) return { label: "ช้า", color: "text-amber-600" };
        return { label: "ช้ามาก", color: "text-red-600" };
    };

    return (
        <ChartCard
            title="Borrow System Health"
            subtitle="ความเร็วและประสิทธิภาพในการอนุมัติ/ปฏิเสธคำขอยืมตัวที่ปรึกษา"
            loading={loading}
            isEmpty={!data}
        >
            {data && (
                <div className="w-full space-y-6">
                    {/* KPI Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Avg Approval Days */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">เวลาอนุมัติ</span>
                            </div>
                            <div className="text-2xl font-black text-emerald-700">{data.avgApprovalDays} <span className="text-sm font-semibold">วัน</span></div>
                            <div className={`text-[10px] font-bold mt-1 ${getSpeedLabel(data.avgApprovalDays).color}`}>
                                {getSpeedLabel(data.avgApprovalDays).label}
                            </div>
                        </div>

                        {/* Avg Rejection Days */}
                        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">เวลาปฏิเสธ</span>
                            </div>
                            <div className="text-2xl font-black text-slate-700">{data.avgRejectionDays} <span className="text-sm font-semibold">วัน</span></div>
                        </div>

                        {/* Rejection Rate */}
                        <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-4 border border-rose-100">
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle className="w-4 h-4 text-rose-500" />
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">อัตราปฏิเสธ</span>
                            </div>
                            <div className={`text-2xl font-black ${getRateColor(data.rejectionRate)}`}>{data.rejectionRate}%</div>
                        </div>

                        {/* Total Processed */}
                        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-4 border border-indigo-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-indigo-500" />
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">ดำเนินการแล้ว</span>
                            </div>
                            <div className="text-2xl font-black text-indigo-700">{data.totalProcessed}</div>
                            <div className="text-[10px] text-indigo-400 mt-1">
                                ✓ {data.approvedCount} อนุมัติ · ✗ {data.rejectedCount} ปฏิเสธ
                            </div>
                        </div>
                    </div>

                    {/* Visual bar */}
                    {data.totalProcessed > 0 && (
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">สัดส่วนอนุมัติ / ปฏิเสธ</div>
                            <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
                                <div
                                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                                    style={{ width: `${(data.approvedCount / data.totalProcessed) * 100}%` }}
                                />
                                <div
                                    className="bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-700"
                                    style={{ width: `${(data.rejectedCount / data.totalProcessed) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                                <span>อนุมัติ {Math.round((data.approvedCount / data.totalProcessed) * 100)}%</span>
                                <span>ปฏิเสธ {Math.round((data.rejectedCount / data.totalProcessed) * 100)}%</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </ChartCard>
    );
}
