"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
    BarElement,
    RadialLinearScale,
    ChartData,
    ChartOptions
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DeanAnalyticsProps {
    stats: {
        visitsByMonth: Record<string, number>;
        problemStats: Record<string, number>;
        genderProblemStats: Record<string, Record<string, number>>;
    };
}

export function DeanAnalytics({ stats }: DeanAnalyticsProps) {
    const monthsTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    // --- 1. Trend Data (Line Chart with Gradient) ---
    const sortedMonths = Object.keys(stats.visitsByMonth || {}).sort();
    const trendData: ChartData<'line'> = {
        labels: sortedMonths.map(m => {
            const [, month] = m.split('-');
            return monthsTH[parseInt(month) - 1] || m;
        }),
        datasets: [
            {
                label: 'จำนวนการเข้ารับบริการ',
                data: sortedMonths.map(m => stats.visitsByMonth[m]),
                borderColor: '#3b82f6',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2.5,
                pointHoverBackgroundColor: '#3b82f6',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 3,
                borderWidth: 2.5,
            },
        ],
    };

    const lineOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                titleFont: { size: 14, weight: 'bold', family: "'Noto Sans Thai', 'Inter', sans-serif" },
                bodyFont: { size: 13, family: "'Noto Sans Thai', 'Inter', sans-serif" },
                padding: { top: 12, bottom: 12, left: 16, right: 16 },
                cornerRadius: 12,
                displayColors: false,
                callbacks: {
                    title: (items) => {
                        const idx = items[0].dataIndex;
                        const monthKey = sortedMonths[idx];
                        const [year, month] = monthKey.split('-');
                        return `📅 ${monthsTH[parseInt(month) - 1]} ${parseInt(year) + 543}`;
                    },
                    label: (item) => {
                        const value = Number(item.raw);
                        return `เข้ารับบริการ: ${value.toLocaleString()} ครั้ง`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(241, 245, 249, 0.8)' },
                border: { display: false },
                ticks: {
                    font: { family: "'Inter', sans-serif", size: 11 },
                    color: '#94a3b8',
                    callback: (value) => Number(value).toLocaleString(),
                    padding: 8,
                },
            },
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    font: { family: "'Noto Sans Thai', 'Inter', sans-serif", size: 11, weight: 'bold' },
                    color: '#64748b',
                    padding: 8,
                },
            },
        },
    };

    // --- 2. Problem Distribution Data (Doughnut Chart) ---
    // Get top 5 problems
    const topProblemsForChart = Object.entries(stats.problemStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const problemTotal = topProblemsForChart.reduce((sum, [, count]) => sum + count, 0);
    const problemColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    const problemHoverColors = ['#2563eb', '#7c3aed', '#db2777', '#d97706', '#059669'];

    const problemDoughnutData: ChartData<'doughnut'> = {
        labels: topProblemsForChart.map(([name]) => name),
        datasets: [{
            data: topProblemsForChart.map(([, count]) => count),
            backgroundColor: problemColors,
            hoverBackgroundColor: problemHoverColors,
            hoverOffset: 8,
            borderWidth: 3,
            borderColor: '#ffffff',
        }],
    };

    const doughnutOptions: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, // Hide default legend
            },
            tooltip: {
                backgroundColor: '#0f172a',
                titleFont: { size: 13, weight: 'bold', family: "'Noto Sans Thai', sans-serif" },
                bodyFont: { size: 12, family: "'Noto Sans Thai', sans-serif" },
                padding: { top: 12, bottom: 12, left: 16, right: 16 },
                cornerRadius: 12,
                callbacks: {
                    title: (items) => items[0].label,
                    label: (item) => {
                        const value = Number(item.raw);
                        const pct = problemTotal > 0 ? ((value / problemTotal) * 100).toFixed(1) : '0';
                        return ` ${value.toLocaleString()} ราย (${pct}%)`;
                    },
                },
            },
        },
        cutout: '70%',
    };

    // --- 3. Problem Data (Horizontal Bar Chart — much cleaner than Radar) ---
    const topProblems = Object.entries(stats.problemStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);

    const totalProblems = topProblems.reduce((sum, [, v]) => sum + v, 0);

    // Build gender breakdown for each problem
    const maleStats = stats.genderProblemStats?.Male || {};
    const femaleStats = stats.genderProblemStats?.Female || {};

    // 4. Problem Stats & Gender (Butterfly Chart)
    const problemBarData: ChartData<'bar'> = {
        labels: topProblems.map(([name]) => name),
        datasets: [
            {
                label: 'ชาย',
                data: topProblems.map(([name]) => {
                    const count = stats.genderProblemStats.Male[name] || 0;
                    return count * -1; // Negative for Left side
                }),
                backgroundColor: '#60a5fa', // Blue-400
                barThickness: 20,
                borderRadius: { topLeft: 4, bottomLeft: 4 },
                borderSkipped: false,
            },
            {
                label: 'หญิง',
                data: topProblems.map(([name]) => stats.genderProblemStats.Female[name] || 0),
                backgroundColor: '#f472b6', // Pink-400
                barThickness: 20,
                borderRadius: { topRight: 4, bottomRight: 4 },
                borderSkipped: false,
            },
        ],
    };

    const maxVal = Math.max(
        ...topProblems.map(([name]) => maleStats[name] || 0),
        ...topProblems.map(([name]) => femaleStats[name] || 0)
    );
    // Add 10% buffer
    const limit = Math.ceil(maxVal * 1.1) || 10;

    const problemBarOptions: ChartOptions<'bar'> = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                right: 32
            }
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: { size: 12, family: "'Noto Sans Thai', 'Inter', sans-serif" },
                    color: '#64748b'
                },
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#e2e8f0',
                titleFont: { size: 14, weight: 'bold', family: "'Noto Sans Thai', sans-serif" },
                bodyFont: { size: 13, family: "'Noto Sans Thai', sans-serif" },
                padding: 16,
                cornerRadius: 8,
                displayColors: true,
                boxPadding: 6,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                callbacks: {
                    title: (items) => items[0].label,
                    label: (item) => {
                        const value = Math.abs(Number(item.raw)); // Absolute value
                        return ` ${item.dataset.label}: ${value.toLocaleString()} ราย`;
                    },
                },
            },
        },
        scales: {
            x: {
                stacked: true, // Stacked for Butterfly
                min: -limit,
                max: limit,
                grid: { color: '#f1f5f9', drawTicks: false },
                border: { display: false },
                ticks: {
                    font: { size: 11, family: "'Inter', sans-serif" },
                    color: '#94a3b8',
                    callback: (value) => Math.abs(Number(value)).toLocaleString(), // Show absolute
                },
            },
            y: {
                stacked: true,
                grid: { display: false },
                border: { display: false },
                ticks: {
                    font: { size: 12, weight: 'bold', family: "'Noto Sans Thai', 'Inter', sans-serif" },
                    color: '#334155',
                    padding: 8,
                },
            },
        },
    };

    const problemChartHeight = Math.max(topProblems.length * 55, 280);

    // Summary stats for the header
    const totalProblemsInChart = problemTotal;
    const totalVisits = Object.values(stats.visitsByMonth || {}).reduce((sum, v) => sum + v, 0);

    return (
        <div className="space-y-6">
            {/* Row 1: Monthly Engagement + Risk Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Monthly Engagement (Wide) */}
                <Card className="col-span-1 lg:col-span-2 border shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800">แนวโน้มการเข้ารับบริการ</CardTitle>
                                <CardDescription>รายเดือนตลอดปีการศึกษา</CardDescription>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-blue-600">{totalVisits.toLocaleString()}</span>
                                <p className="text-xs text-slate-400">ครั้งทั้งหมด</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                        <Line data={trendData} options={lineOptions} />
                    </CardContent>
                </Card>

                {/* 2. Problem Distribution (Narrow) */}
                <Card className="col-span-1 border shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold text-slate-800">ปัญหาที่พบบ่อย</CardTitle>
                        <CardDescription>5 อันดับปัญหาหลักที่นิสิตมาขอความช่วยเหลือ</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="h-[240px] relative flex items-center justify-center">
                            <Doughnut data={problemDoughnutData} options={doughnutOptions} />
                            {/* Centered Text Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-black text-slate-800">
                                    {totalProblemsInChart.toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider mt-1">ราย</span>
                            </div>
                        </div>
                        {/* Custom Legend */}
                        <div className="flex flex-col gap-2 mt-4">
                            {topProblemsForChart.map(([name, count], idx) => (
                                <div key={name} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: problemColors[idx] }}></div>
                                        <span className="text-sm text-slate-600 truncate" title={name}>{name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-800">{count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Problem Breakdown (Stacked Horizontal Bar by Gender) */}
            <Card className="border shadow-sm bg-white">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800">ประเภทปัญหาที่พบ</CardTitle>
                            <CardDescription>แยกตามเพศ — Top {topProblems.length} หมวดหมู่</CardDescription>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-indigo-600">{totalProblems.toLocaleString()}</span>
                            <p className="text-xs text-slate-400">รายทั้งหมด</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent style={{ height: `${problemChartHeight}px` }}>
                    <Bar data={problemBarData} options={problemBarOptions} />
                </CardContent>
            </Card>
        </div>
    );
}
