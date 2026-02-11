"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, Users, Repeat } from "lucide-react";
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
);

interface ExecutiveSummarySectionProps {
    stats: {
        totalBookings: number;
        repeatStats: { single: number; repeat: number };
        visitTrend: string;
        visitsByMonth: Record<string, number>;
        departmentStats: Array<{
            departmentName: string;
            bookingCount: number;
        }>;
    };
}

export function ExecutiveSummarySection({ stats }: ExecutiveSummarySectionProps) {
    // 1. Repeat Visit Rate (Gauge-style Doughnut)
    const repeatRate = stats.totalBookings > 0
        ? ((stats.repeatStats.repeat / stats.totalBookings) * 100).toFixed(1)
        : '0';

    const repeatValue = parseFloat(repeatRate);
    const gaugeData: ChartData<'doughnut'> = {
        labels: ['กลับมาใช้บริการซ้ำ', 'ใช้บริการครั้งเดียว'],
        datasets: [{
            data: [repeatValue, 100 - repeatValue],
            backgroundColor: ['#10b981', '#e5e7eb'],
            borderWidth: 0,
        }],
    };

    const gaugeOptions: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        circumference: 180,
        rotation: -90,
        cutout: '75%',
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.parsed}%`
                }
            }
        }
    };

    // 2. Visit Trend (Last 6 months)
    const monthEntries = Object.entries(stats.visitsByMonth || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6);

    const trendData: ChartData<'line'> = {
        labels: monthEntries.map(([month]) => {
            const [year, monthNum] = month.split('-');
            return `${monthNum}/${year.slice(-2)}`;
        }),
        datasets: [{
            label: 'จำนวนการเข้ารับบริการ',
            data: monthEntries.map(([, count]) => count),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
        }]
    };

    const trendOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                titleFont: { family: "'Noto Sans Thai', sans-serif" },
                bodyFont: { family: "'Noto Sans Thai', sans-serif" },
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { font: { family: "'Noto Sans Thai', sans-serif" } }
            },
            x: {
                ticks: { font: { family: "'Noto Sans Thai', sans-serif" } }
            }
        }
    };

    // 3. Top 3 Departments
    const topDepartments = [...stats.departmentStats]
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, 3);

    const maxCount = topDepartments[0]?.bookingCount || 1;

    const visitTrendValue = parseFloat(stats.visitTrend);
    const isTrendingUp = visitTrendValue > 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900">สรุปภาพรวม</h2>
                <p className="text-sm text-slate-500">ตัวชี้วัดสำคัญและแนวโน้มของคณะ</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Repeat Visit Gauge */}
                <Card className="border shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Repeat className="h-5 w-5 text-emerald-600" />
                            อัตราการกลับมาใช้บริการ
                        </CardTitle>
                        <CardDescription>นิสิตที่กลับมาใช้บริการมากกว่า 1 ครั้ง</CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="h-[140px] relative">
                            <Doughnut data={gaugeData} options={gaugeOptions} />
                            <div className="absolute inset-0 flex items-end justify-center pb-2">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-emerald-600">{repeatRate}%</div>
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                                        {stats.repeatStats.repeat} / {stats.totalBookings} ราย
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Visit Trend */}
                <Card className="border shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            {isTrendingUp ? (
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-slate-600" />
                            )}
                            แนวโน้มการเข้ารับบริการ
                        </CardTitle>
                        <CardDescription>6 เดือนล่าสุด</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[140px]">
                            <Line data={trendData} options={trendOptions} />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Top Departments */}
                <Card className="border shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-600" />
                            ภาควิชาที่ใช้บริการมากที่สุด
                        </CardTitle>
                        <CardDescription>Top 3 อันดับ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topDepartments.map((dept, idx) => {
                                const percentage = (dept.bookingCount / maxCount) * 100;
                                const colors = ['bg-purple-500', 'bg-blue-500', 'bg-slate-400'];
                                return (
                                    <div key={dept.departmentName} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-slate-700 truncate flex-1">
                                                {idx + 1}. {dept.departmentName}
                                            </span>
                                            <span className="font-bold text-slate-900 ml-2">
                                                {dept.bookingCount}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className={`${colors[idx]} h-2 rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
