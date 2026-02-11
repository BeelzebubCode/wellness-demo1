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

interface RectorAnalyticsChartsProps {
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

export function RectorAnalyticsCharts({ analytics }: RectorAnalyticsChartsProps) {
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

    // Chart Global Defaults
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    font: { size: 11, weight: 'bold' as const },
                    usePointStyle: true,
                    padding: 15,
                }
            }
        }
    };

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
                borderRadius: 4,
            },
        ],
    };

    const problemOptions: ChartOptions<'bar'> = {
        ...commonOptions,
        indexAxis: 'y' as const,
        plugins: {
            ...commonOptions.plugins,
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
                borderRadius: 4,
            },
            {
                label: 'หญิง',
                data: femaleData,
                backgroundColor: colors.accentAlpha,
                borderColor: colors.accent,
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
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
                tension: 0.4,
                fill: true,
                pointBackgroundColor: colors.primary,
                pointBorderColor: '#fff',
                pointHoverRadius: 6,
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
        { name: "สูง (High)", value: riskDistribution.HIGH, color: "#ef4444", bg: "bg-red-50" },
        { name: "กลาง (Medium)", value: riskDistribution.MEDIUM, color: "#f97316", bg: "bg-orange-50" },
        { name: "ต่ำ (Low)", value: riskDistribution.LOW, color: "#22c55e", bg: "bg-green-50" },
        { name: "ปกติ (Normal)", value: riskDistribution.NORMAL, color: "#64748b", bg: "bg-slate-50" },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-700">ประเภทปัญหาของนิสิตทั้งมหาวิทยาลัย</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 h-[240px]">
                        {problemLabels.length > 0 ? (
                            <Bar data={problemChartData} options={problemOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">ไม่มีข้อมูล</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-700">แยกตามเพศและปัญหา</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 h-[240px]">
                        {genderLabels.length > 0 ? (
                            <Bar data={genderChartData} options={commonOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">ไม่มีข้อมูล</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 bg-white/80 backdrop-blur-sm border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-700">ช่วงเวลาการเข้ารับคำปรึกษา (รายเดือน)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 h-[240px]">
                        {sortedMonths.length > 0 ? (
                            <Line data={timeChartData} options={commonOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">ไม่มีข้อมูล</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-700">สัดส่วนการมาซ้ำ (Consistency)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 h-[240px] flex items-center justify-center">
                        <div className="w-full max-w-[180px]">
                            <Pie data={repeatChartData} options={commonOptions} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white/90 backdrop-blur-md border-none shadow-sm rounded-[2rem] overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-slate-700">สัดส่วนรายละเอียดเคสตามระดับความเสี่ยง (Case Breakdown)</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {riskItems.map((item) => (
                            <div key={item.name} className={`${item.bg} flex flex-col items-center p-4 rounded-2xl transition-transform hover:scale-105 duration-200`}>
                                <span className="text-3xl font-black mb-1" style={{ color: item.color }}>{item.value}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
