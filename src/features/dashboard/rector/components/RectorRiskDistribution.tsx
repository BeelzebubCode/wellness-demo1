"use client";

import { Card, CardContent } from "@/components/ui/Card";

interface RiskDistributionProps {
    data?: {
        HIGH: number;
        MEDIUM: number;
        LOW: number;
        NORMAL: number;
    };
}

export function RectorRiskDistribution({ data }: RiskDistributionProps) {
    const riskLevels = [
        {
            label: "ปกติ (Normal)",
            value: data?.NORMAL || 0,
            colorClass: "text-slate-600",
            bgClass: "bg-slate-50",
            dotClass: "bg-slate-400",
        },
        {
            label: "เสี่ยงสูง (High)",
            value: data?.HIGH || 0,
            colorClass: "text-red-600",
            bgClass: "bg-red-50",
            dotClass: "bg-red-500",
        },
        {
            label: "เสี่ยงปานกลาง (Medium)",
            value: data?.MEDIUM || 0,
            colorClass: "text-orange-600",
            bgClass: "bg-orange-50",
            dotClass: "bg-orange-500",
        },
        {
            label: "เสี่ยงต่ำ (Low)",
            value: data?.LOW || 0,
            colorClass: "text-green-600",
            bgClass: "bg-green-50",
            dotClass: "bg-green-500",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {riskLevels.map((risk) => (
                <Card key={risk.label} className={`${risk.bgClass} border-none shadow-sm`}>
                    <CardContent className="p-4 flex flex-col items-center justify-center space-y-1">
                        <span className={`text-2xl font-bold ${risk.colorClass}`}>
                            {risk.value}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${risk.dotClass}`} />
                            <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                                {risk.label}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
