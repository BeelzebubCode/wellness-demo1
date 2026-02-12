"use client";

import { Card } from "@/components/ui/Card";
import { Users, AlertTriangle, Activity, TrendingUp, TrendingDown, Clock, Minus } from "lucide-react";

interface RectorOverviewCardsProps {
    stats: {
        totalStudents: number;
        totalBookings: number;
        activeCases: number;
        visitTrend: string;
        riskDistribution: {
            HIGH: number;
            MEDIUM: number;
            LOW: number;
            NORMAL: number;
        };
        visitsByMonth: Record<string, number>;
        repeatStats: {
            single: number;
            repeat: number;
        };
    };
}

export function RectorOverviewCards({ stats }: RectorOverviewCardsProps) {
    // Calculate High Risk Rate
    const totalRisks = stats.riskDistribution.HIGH + stats.riskDistribution.MEDIUM + stats.riskDistribution.LOW + stats.riskDistribution.NORMAL;
    const highRiskRate = totalRisks > 0
        ? ((stats.riskDistribution.HIGH / totalRisks) * 100).toFixed(1)
        : "0.0";

    // Utilization Rate
    const utilizationRate = stats.totalStudents > 0
        ? ((stats.totalBookings / stats.totalStudents) * 100).toFixed(1)
        : "0.0";

    // Repeat rate
    const totalUniqueStudents = stats.repeatStats.single + stats.repeatStats.repeat;
    const repeatRate = totalUniqueStudents > 0
        ? ((stats.repeatStats.repeat / totalUniqueStudents) * 100).toFixed(1)
        : "0.0";

    // Visit trend
    const trendVal = parseFloat(stats.visitTrend);
    const TrendIcon = trendVal > 0 ? TrendingUp : trendVal < 0 ? TrendingDown : Minus;
    const trendColor = trendVal > 0
        ? "text-emerald-600 bg-emerald-50"
        : trendVal < 0
            ? "text-red-600 bg-red-50"
            : "text-slate-500 bg-slate-100";

    const cards = [
        {
            label: "นิสิตทั้งหมด",
            sublabel: "Total Students",
            value: stats.totalStudents.toLocaleString(),
            icon: Users,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            footer: (
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">ข้อมูลทั้งมหาวิทยาลัย</span>
            ),
            accent: "border-l-primary",
        },
        {
            label: "กลุ่มเสี่ยงสูง",
            sublabel: "High Risk",
            value: `${highRiskRate}%`,
            valueColor: "text-red-600",
            icon: AlertTriangle,
            iconBg: "bg-red-50",
            iconColor: "text-primary",
            footer: (
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {stats.riskDistribution.HIGH.toLocaleString()} จาก {totalRisks.toLocaleString()} คน
                </span>
            ),
            accent: "border-l-primary",
        },
        {
            label: "อัตราการเข้าถึง",
            sublabel: "Utilization",
            value: `${utilizationRate}%`,
            icon: Activity,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            footer: (
                <div className="flex items-center gap-2">
                    <span className={`font-black flex items-center px-1.5 py-0.5 rounded text-xs ${trendColor}`}>
                        <TrendIcon className="w-3 h-3 mr-0.5" />
                        {trendVal > 0 ? '+' : ''}{stats.visitTrend}%
                    </span>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">จากเดือนก่อน</span>
                </div>
            ),
            accent: "border-l-primary",
        },
        {
            label: "เคสที่กำลังดูแล",
            sublabel: "Active Cases",
            value: stats.activeCases.toLocaleString(),
            icon: Clock,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            footer: (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        ติดตามอยู่
                    </span>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                        กลับมาซ้ำ {repeatRate}%
                    </span>
                </div>
            ),
            accent: "border-l-primary",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div
                        key={i}
                        className={`bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 p-6 border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 flex flex-col justify-between border-l-8 ${card.accent.replace('border-l-', 'border-')}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center ring-4 ring-white shadow-sm transition-transform group-hover:rotate-6">
                                <Icon className={`h-5 w-5 ${card.iconColor}`} />
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                                    {card.label}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className={`text-3xl font-black tracking-tight ${card.valueColor || 'text-slate-800'}`}>
                                {card.value}
                            </h3>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-50/80">
                            {card.footer}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
