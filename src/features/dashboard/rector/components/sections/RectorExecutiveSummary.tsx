"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface RectorExecutiveSummaryProps {
    stats: {
        totalBookings: number;
        repeatStats: {
            single: number;
            repeat: number;
        };
        visitsByMonth: Record<string, number>;
        universityName: string;
        wellbeing?: {
            overallScore: number;
        };
    };
}

export function RectorExecutiveSummary({ stats }: RectorExecutiveSummaryProps) {
    const totalCases = stats.totalBookings;
    const repeatRate = totalCases > 0
        ? Math.round((stats.repeatStats.repeat / (stats.repeatStats.single + stats.repeatStats.repeat)) * 100)
        : 0;

    // Use wellbeing score if available, else derived mock
    const overallScore = stats.wellbeing?.overallScore ?? 75;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">
                สถานการณ์โดยรวมของมหาวิทยาลัย (Executive Summary)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            ปริมาณงานภาพรวม (Total Volume)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">{totalCases.toLocaleString()}</div>
                        <p className="text-xs text-slate-400 mt-1">จำนวนการดูแลทั้งหมดในปีการศึกษานี้</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            คะแนนสุขภาวะภาพรวม (Wellbeing Score)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-4xl font-black ${overallScore > 70 ? 'text-emerald-600' : overallScore < 50 ? 'text-red-600' : 'text-amber-500'}`}>
                            {overallScore}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">คำนวณจากความเสี่ยง, ความพึงพอใจ และการมีส่วนร่วม</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            สัดส่วนนิสิตที่ติดตามต่อเนื่อง (Retention)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">{repeatRate}%</div>
                        <p className="text-xs text-slate-400 mt-1">เปอร์เซ็นต์ของนิสิตที่กลับมาใช้บริการซ้ำ</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
