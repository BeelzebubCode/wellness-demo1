"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface ExecutiveOverviewSectionProps {
    stats: {
        totalBookings: number;
        repeatStats: {
            single: number;
            repeat: number;
        };
        visitsByMonth: Record<string, number>;
        facultyName: string;
    };
}

export function ExecutiveOverviewSection({ stats }: ExecutiveOverviewSectionProps) {
    const totalCases = stats.totalBookings;
    const repeatRate = totalCases > 0
        ? Math.round((stats.repeatStats.repeat / (stats.repeatStats.single + stats.repeatStats.repeat)) * 100)
        : 0;

    // Mocking evaluation rate to match the "Low" narrative
    const evaluationRate = 45;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">
                สถานการณ์โดยรวมของคณะ
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            จำนวนการเข้ารับการดูแลทั้งหมด
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">{totalCases}</div>
                        <p className="text-xs text-slate-400 mt-1">ภาระงานของคณะในช่วงนี้</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            สัดส่วนนิสิตที่ต้องติดตามต่อ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">{repeatRate}%</div>
                        <p className="text-xs text-slate-400 mt-1">ยิ่งสูง = ภาระระยะยาวมากขึ้น</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            การประเมินผลหลังการรักษา
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900 text-red-600">{evaluationRate}%</div>
                        <p className="text-xs text-red-500 mt-1">ต่ำกว่าเกณฑ์ → ข้อมูลคุณภาพไม่เพียงพอ</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
