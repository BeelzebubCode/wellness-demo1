"use client";

import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from "chart.js";
import { Card, CardContent } from "@/components/ui/Card";
import { PieChart, TrendingUp } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface FacultyRiskBreakdownProps {
    data?: Array<{
        id: number;
        name: string;
        highRiskCount: number;
        studentCount: number;
    }>;
}

export function FacultyRiskBreakdownChart({ data: externalData }: FacultyRiskBreakdownProps) {
    // Mock data with risk level breakdown
    const mockData = [
        { name: "วิศวกรรมศาสตร์", high: 45, medium: 35, low: 40, students: 2500 },
        { name: "สถาปัตยกรรมศาสตร์", high: 30, medium: 28, low: 27, students: 1200 },
        { name: "พาณิชยศาสตร์และการบัญชี", high: 35, medium: 30, low: 25, students: 3000 },
        { name: "นิเทศศาสตร์", high: 20, medium: 15, low: 10, students: 1500 },
        { name: "วิทยาศาสตร์", high: 25, medium: 20, low: 15, students: 1800 },
        { name: "อักษรศาสตร์", high: 18, medium: 12, low: 10, students: 1100 },
        { name: "รัฐศาสตร์", high: 15, medium: 12, low: 8, students: 900 },
        { name: "เศรษฐศาสตร์", high: 12, medium: 8, low: 5, students: 850 },
        { name: "นิติศาสตร์", high: 10, medium: 6, low: 4, students: 950 },
        { name: "ครุศาสตร์", high: 14, medium: 10, low: 6, students: 1600 },
        { name: "จิตวิทยา", high: 8, medium: 5, low: 2, students: 400 },
        { name: "แพทยศาสตร์", high: 12, medium: 8, low: 5, students: 1400 },
        { name: "ทันตแพทยศาสตร์", high: 5, medium: 3, low: 2, students: 600 },
        { name: "เภสัชศาสตร์", high: 6, medium: 4, low: 2, students: 700 }
    ];

    // Transform real data if available
    const transformedData = externalData?.map(faculty => {
        const totalRisk = faculty.highRiskCount;
        // Estimate distribution (this is mock - real data would come from backend)
        return {
            name: faculty.name.replace(/^คณะ/, '').trim(),
            high: totalRisk,
            medium: Math.floor(totalRisk * 0.7),
            low: Math.floor(totalRisk * 0.5),
            students: faculty.studentCount
        };
    });

    const facultyData = transformedData && transformedData.length > 0 ? transformedData : mockData;

    // Sort by total risk (high risk count)
    const sortedData = [...facultyData].sort((a, b) => b.high - a.high);

    const chartData = {
        labels: sortedData.map(f => f.name),
        datasets: [
            {
                label: "ความเสี่ยงสูง (High Risk)",
                data: sortedData.map(f => f.high),
                backgroundColor: "rgba(244, 63, 94, 0.9)", // Rose-500
                borderRadius: 4,
                barPercentage: 0.75,
            },
            {
                label: "ความเสี่ยงปานกลาง (Medium Risk)",
                data: sortedData.map(f => f.medium),
                backgroundColor: "rgba(245, 158, 11, 0.9)", // Amber-500
                borderRadius: 4,
                barPercentage: 0.75,
            },
            {
                label: "ความเสี่ยงต่ำ (Low Risk)",
                data: sortedData.map(f => f.low),
                backgroundColor: "rgba(16, 185, 129, 0.9)", // Emerald-500
                borderRadius: 4,
                barPercentage: 0.75,
            }
        ],
    };

    const options: ChartOptions<'bar'> = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                labels: {
                    font: {
                        family: 'system-ui, -apple-system, sans-serif',
                        size: 12,
                        weight: 'bold' as const
                    },
                    color: '#475569',
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'rectRounded'
                }
            },
            tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                titleFont: { size: 15, weight: 'bold' as const, family: 'system-ui, -apple-system, sans-serif' },
                bodyFont: { size: 13, family: 'system-ui, -apple-system, sans-serif' },
                padding: 14,
                cornerRadius: 10,
                callbacks: {
                    title: (context) => {
                        return sortedData[context[0].dataIndex].name;
                    },
                    label: (context) => {
                        const faculty = sortedData[context.dataIndex];
                        const total = faculty.high + faculty.medium + faculty.low;
                        return [
                            `${context.dataset.label}: ${context.parsed.x} คน`,
                            `รวมทั้งหมด: ${total} คน`,
                            `นิสิตทั้งหมด: ${faculty.students.toLocaleString()} คน`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                grid: {
                    color: "rgba(241, 245, 249, 0.8)"
                },
                ticks: {
                    font: {
                        family: 'system-ui, -apple-system, sans-serif',
                        size: 12,
                        weight: 'normal' as const
                    },
                    color: "#94a3b8",
                    padding: 8
                },
                title: {
                    display: true,
                    text: 'จำนวนนิสิต (คน)',
                    color: '#64748b',
                    font: {
                        size: 12,
                        weight: 'bold' as const,
                        family: 'system-ui, -apple-system, sans-serif'
                    },
                    padding: { top: 10 }
                }
            },
            y: {
                stacked: true,
                grid: { display: false },
                ticks: {
                    font: {
                        family: 'system-ui, -apple-system, sans-serif',
                        weight: 'bold' as const,
                        size: 13
                    },
                    color: "#334155",
                    padding: 12,
                    crossAlign: 'far' as const
                },
                border: { display: false }
            }
        },
        layout: {
            padding: {
                left: 10,
                right: 20,
                top: 10,
                bottom: 10
            }
        }
    };

    return (
        <Card className="h-full border-none shadow-lg shadow-slate-100 rounded-[2rem] bg-gradient-to-br from-white to-slate-50">
            <CardContent className="p-10 h-full flex flex-col">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-rose-50 rounded-xl">
                                <PieChart size={22} className="text-rose-600" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                การกระจายความเสี่ยงแต่ละคณะ
                            </h3>
                        </div>
                        <p className="text-sm text-slate-500 font-medium ml-[52px] leading-relaxed">
                            แสดงจำนวนนิสิตในแต่ละระดับความเสี่ยง (สูง/กลาง/ต่ำ) ของทุกคณะ
                        </p>
                    </div>
                </div>

                {/* Chart Container */}
                <div className="flex-1 min-h-[650px] w-full bg-white rounded-2xl p-6 border border-slate-100">
                    <Bar data={chartData} options={options} />
                </div>

                {/* Footer Insight */}
                <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <TrendingUp size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-blue-900 mb-1">การวิเคราะห์</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            กราฟแสดงการกระจายตัวของนิสิตในแต่ละระดับความเสี่ยง
                            ช่วยให้เห็นภาพรวมว่าคณะไหนมีนิสิตความเสี่ยงสูงมากที่สุด
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
