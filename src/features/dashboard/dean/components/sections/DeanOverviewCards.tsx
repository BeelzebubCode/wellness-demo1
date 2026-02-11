"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Users, AlertTriangle, Activity, TrendingUp, TrendingDown, Clock, Minus } from "lucide-react";

interface DeanOverviewCardsProps {
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

export function DeanOverviewCards({ stats }: DeanOverviewCardsProps) {
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
            label: "นิสิตในสังกัด",
            sublabel: "Total Students",
            value: stats.totalStudents.toLocaleString(),
            icon: Users,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            footer: (
                <span className="text-slate-400 text-xs">ข้อมูลจากทะเบียน</span>
            ),
            accent: "border-l-blue-500",
        },
        {
            label: "กลุ่มเสี่ยงสูง",
            sublabel: "High Risk",
            value: `${highRiskRate}%`,
            valueColor: "text-red-600",
            icon: AlertTriangle,
            iconBg: "bg-red-50",
            iconColor: "text-red-500",
            footer: (
                <span className="text-slate-400 text-xs">
                    {stats.riskDistribution.HIGH.toLocaleString()} จาก {totalRisks.toLocaleString()} คน
                </span>
            ),
            accent: "border-l-red-500",
        },
        {
            label: "อัตราการเข้าถึง",
            sublabel: "Utilization",
            value: `${utilizationRate}%`,
            icon: Activity,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-600",
            footer: (
                <div className="flex items-center gap-2">
                    <span className={`font-bold flex items-center px-1.5 py-0.5 rounded text-xs ${trendColor}`}>
                        <TrendIcon className="w-3 h-3 mr-0.5" />
                        {trendVal > 0 ? '+' : ''}{stats.visitTrend}%
                    </span>
                    <span className="text-slate-400 text-xs">จากเดือนก่อน</span>
                </div>
            ),
            accent: "border-l-indigo-500",
        },
        {
            label: "เคสที่กำลังดูแล",
            sublabel: "Active Cases",
            value: stats.activeCases.toLocaleString(),
            icon: Clock,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            footer: (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        ติดตามอยู่
                    </span>
                    <span className="text-slate-400 text-xs">
                        กลับมาซ้ำ {repeatRate}%
                    </span>
                </div>
            ),
            accent: "border-l-amber-500",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <Card
                        key={i}
                        className={`border shadow-sm bg-white hover:shadow-md transition-all duration-200 border-l-4 ${card.accent}`}
                    >
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-500 truncate">
                                        {card.label}
                                    </p>
                                    <h3 className={`text-3xl font-black mt-1.5 ${card.valueColor || 'text-slate-900'}`}>
                                        {card.value}
                                    </h3>
                                </div>
                                <div className={`p-2.5 ${card.iconBg} rounded-xl flex-shrink-0`}>
                                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                {card.footer}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
