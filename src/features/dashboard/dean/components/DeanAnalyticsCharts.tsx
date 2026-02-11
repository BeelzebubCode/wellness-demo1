"use client";

import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    ChartData,
    ChartOptions
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

// Register ChartJS modules
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

interface DeanAnalyticsChartsProps {
    analytics: any;
}

// Helper to get CSS variable value
function getCSSVariable(variable: string): string {
    if (typeof window === 'undefined') return '';
    const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    return value;
}

// Helper to convert RGB string to rgba
function rgbToRgba(rgb: string, alpha: number): string {
    return `rgba(${rgb}, ${alpha})`;
}

export function DeanAnalyticsCharts({ analytics }: DeanAnalyticsChartsProps) {
    const [colors, setColors] = useState({
        primary: 'rgb(59, 130, 246)',
        primaryAlpha: 'rgba(59, 130, 246, 0.6)',
        accent: 'rgb(236, 72, 153)',
        accentAlpha: 'rgba(236, 72, 153, 0.8)',
    });

    useEffect(() => {
        // Get CSS variables on mount
        const primaryRgb = getCSSVariable('--primary');
        const accentRgb = getCSSVariable('--accent');

        if (primaryRgb) {
            setColors({
                primary: `rgb(${primaryRgb})`,
                primaryAlpha: rgbToRgba(primaryRgb, 0.6),
                accent: `rgb(${accentRgb || primaryRgb})`,
                accentAlpha: rgbToRgba(accentRgb || primaryRgb, 0.8),
            });
        }
    }, []);

    if (!analytics) return null;

    // 1. Problem Stats Data (Bar Chart)
    const problemLabels = Object.keys(analytics.problemStats || {});
    const problemDataVals = Object.values(analytics.problemStats || {});

    const problemChartData: ChartData<'bar'> = {
        labels: problemLabels,
        datasets: [
            {
                label: 'จำนวนเคส',
                data: problemDataVals as number[],
                backgroundColor: colors.primaryAlpha,
                borderColor: colors.primary,
                borderWidth: 1,
            },
        ],
    };

    const problemOptions: ChartOptions<'bar'> = {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: false },
        },
    };

    // 2. Gender vs Problem Data (Grouped Bar)
    const allProblems = new Set<string>();
    Object.values(analytics.genderProblemStats || {}).forEach((probs: any) => {
        Object.keys(probs).forEach(p => allProblems.add(p));
    });
    const genderLabels = Array.from(allProblems);

    const maleData = genderLabels.map(p => (analytics.genderProblemStats?.Male?.[p] || 0));
    const femaleData = genderLabels.map(p => (analytics.genderProblemStats?.Female?.[p] || 0));

    const genderChartData: ChartData<'bar'> = {
        labels: genderLabels,
        datasets: [
            {
                label: 'ชาย',
                data: maleData,
                backgroundColor: colors.primaryAlpha,
                borderColor: colors.primary,
                borderWidth: 1,
            },
            {
                label: 'หญิง',
                data: femaleData,
                backgroundColor: colors.accentAlpha,
                borderColor: colors.accent,
                borderWidth: 1,
            },
        ],
    };

    const genderOptions: ChartOptions<'bar'> = {
        responsive: true,
        scales: {
            x: { stacked: false },
            y: { stacked: false },
        },
    };

    // 3. Time Stats Data (Monthly Line)
    const sortedMonths = Object.keys(analytics.visitsByMonth || {}).sort();
    const timeChartData: ChartData<'line'> = {
        labels: sortedMonths,
        datasets: [
            {
                label: 'จำนวนการเข้ารับคำปรึกษา',
                data: sortedMonths.map(m => analytics.visitsByMonth[m]),
                borderColor: colors.primary,
                backgroundColor: colors.primaryAlpha,
                tension: 0.3,
            },
        ],
    };

    // 4. Repeat Stats (Pie)
    const repeatChartData: ChartData<'pie'> = {
        labels: ['มาครั้งเดียว', 'มาซ้ำ (Repeat)'],
        datasets: [
            {
                data: [analytics.repeatStats?.single || 0, analytics.repeatStats?.repeat || 0],
                backgroundColor: [
                    'rgba(226, 232, 240, 0.8)', // Slate 200 (light neutral)
                    colors.primary, // Full university primary color
                ],
                hoverBackgroundColor: [
                    'rgba(203, 213, 225, 1)',
                    colors.primary,
                ],
                borderWidth: 2,
                borderColor: '#ffffff',
            },
        ],
    };

    // 5. Risk Stats Data derived for display
    const riskDistribution = analytics.riskDistribution || { HIGH: 0, MEDIUM: 0, LOW: 0, NORMAL: 0 };
    const riskItems = [
        { name: "สูง (High)", value: riskDistribution.HIGH, colorClass: "text-red-600", bgClass: "bg-red-50" },
        { name: "กลาง (Medium)", value: riskDistribution.MEDIUM, colorClass: "text-orange-600", bgClass: "bg-orange-50" },
        { name: "ต่ำ (Low)", value: riskDistribution.LOW, colorClass: "text-green-600", bgClass: "bg-green-50" },
        { name: "ปกติ (Normal)", value: riskDistribution.NORMAL, colorClass: "text-slate-600", bgClass: "bg-slate-50" },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Problem Types */}
                <Card variant="default">
                    <CardHeader>
                        <CardTitle className="text-lg">ประเภทปัญหาของนิสิต</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="min-h-[300px] flex items-center justify-center">
                            {problemLabels.length > 0 ? (
                                <Bar data={problemChartData} options={problemOptions} />
                            ) : (
                                <p className="text-gray-400">ไม่มีข้อมูล</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Gender vs Problem */}
                <Card variant="default">
                    <CardHeader>
                        <CardTitle className="text-lg">แยกตามเพศและปัญหา</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="min-h-[300px] flex items-center justify-center">
                            {genderLabels.length > 0 ? (
                                <Bar data={genderChartData} options={genderOptions} />
                            ) : (
                                <p className="text-gray-400">ไม่มีข้อมูล</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Time Analysis */}
                <Card className="md:col-span-2" variant="default">
                    <CardHeader>
                        <CardTitle className="text-lg">ช่วงเวลาการเข้ารับคำปรึกษา</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="min-h-[300px] flex items-center justify-center">
                            {sortedMonths.length > 0 ? (
                                <Line data={timeChartData} />
                            ) : (
                                <p className="text-gray-400">ไม่มีข้อมูล</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Repeat Stats */}
                <Card variant="default">
                    <CardHeader>
                        <CardTitle className="text-lg">สัดส่วนการมาซ้ำ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="min-h-[300px] flex items-center justify-center">
                            <div className="w-full max-w-[220px]">
                                <Pie data={repeatChartData} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Risk Distribution */}
            <Card variant="default">
                <CardHeader>
                    <CardTitle className="text-lg">สัดส่วนเคสตามความเสี่ยง</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {riskItems.map((item) => (
                            <div key={item.name} className={`flex flex-col items-center p-4 ${item.bgClass} rounded-lg border border-gray-100 transition-all hover:shadow-md`}>
                                <span className={`text-3xl font-bold ${item.colorClass}`}>{item.value}</span>
                                <span className="text-sm text-gray-600 mt-1">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
