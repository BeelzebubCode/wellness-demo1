"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Users, FileText, AlertTriangle } from "lucide-react";

interface RectorStatsCardsProps {
    stats: {
        totalStudents: number;
        totalBookings: number;
        universityName: string;
        riskDistribution: {
            HIGH: number;
            MEDIUM: number;
            LOW: number;
            NORMAL: number;
        };
    };
}

export function RectorStatsCards({ stats }: RectorStatsCardsProps) {
    const highRiskCount = stats.riskDistribution.HIGH;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-900">นิสิตทั้งหมดในมหาวิทยาลัย</CardTitle>
                    <Users className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{stats.totalStudents.toLocaleString()}</div>
                    <p className="text-xs text-slate-500">คน (ทุกคณะ)</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-900">การเข้ารับคำปรึกษาทั้งหมด</CardTitle>
                    <FileText className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{stats.totalBookings.toLocaleString()}</div>
                    <p className="text-xs text-slate-500">ครั้ง (สะสม)</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-900">เคสความเสี่ยงสูง</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{highRiskCount.toLocaleString()}</div>
                    <p className="text-xs text-slate-500">เคสที่ต้องให้การดูแลเป็นพิเศษ</p>
                </CardContent>
            </Card>
        </div>
    );
}
