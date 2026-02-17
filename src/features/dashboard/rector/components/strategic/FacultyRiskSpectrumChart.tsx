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
import { LayoutGrid, AlertCircle } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface FacultySpectrumProps {
    data?: Array<{
        id: number;
        name: string;
        engagementRate: number;
        riskIndex: number;
        studentCount: number;
        highRiskCount: number;
    }>;
}

export function FacultyRiskSpectrumChart({ data: externalData }: FacultySpectrumProps) {
    // Mock data - will be replaced with real data from useUniversityStats
    const mockData = [
        { name: "วิศวกรรมศาสตร์", riskScore: 4.2, students: 2500, activeCases: 120 },
        { name: "สถาปัตยกรรมศาสตร์", riskScore: 3.8, students: 1200, activeCases: 85 },
        { name: "พาณิชยศาสตร์และการบัญชี", riskScore: 3.5, students: 3000, activeCases: 90 },
        { name: "นิเทศศาสตร์", riskScore: 3.2, students: 1500, activeCases: 45 },
        { name: "วิทยาศาสตร์", riskScore: 2.9, students: 1800, activeCases: 60 },
        { name: "อักษรศาสตร์", riskScore: 2.8, students: 1100, activeCases: 40 },
        { name: "รัฐศาสตร์", riskScore: 2.7, students: 900, activeCases: 35 },
        { name: "เศรษฐศาสตร์", riskScore: 2.5, students: 850, activeCases: 25 },
        { name: "นิติศาสตร์", riskScore: 2.4, students: 950, activeCases: 20 },
        { name: "ครุศาสตร์", riskScore: 2.2, students: 1600, activeCases: 30 },
        { name: "จิตวิทยา", riskScore: 2.1, students: 400, activeCases: 15 },
        { name: "แพทยศาสตร์", riskScore: 1.9, students: 1400, activeCases: 25 },
        { name: "ทันตแพทยศาสตร์", riskScore: 1.8, students: 600, activeCases: 10 },
        { name: "เภสัชศาสตร์", riskScore: 1.7, students: 700, activeCases: 12 }
    ];

    // Transform real data from healthMap to match our chart format
    const transformedData = externalData?.map(faculty => ({
        name: faculty.name.replace(/^คณะ/, '').trim(), // Remove "คณะ" prefix if exists
        riskScore: faculty.riskIndex,
        students: faculty.studentCount,
        activeCases: faculty.highRiskCount // Using highRiskCount as active cases proxy
    }));

    const facultyData = transformedData && transformedData.length > 0 ? transformedData : mockData;
    const sortedData = [...facultyData].sort((a, b) => b.riskScore - a.riskScore);

    const chartData = {
        labels: sortedData.map(f => f.name),
        datasets: [
            {
                label: "ดัชนีความเสี่ยง (Risk Index)",
                data: sortedData.map(f => f.riskScore),
                backgroundColor: sortedData.map(f => {
                    if (f.riskScore >= 4.0) return "rgba(244, 63, 94, 0.9)"; // Rose-500
                    if (f.riskScore >= 3.0) return "rgba(245, 158, 11, 0.9)"; // Amber-500
                    return "rgba(16, 185, 129, 0.9)"; // Emerald-500
                }),
                borderRadius: 6,
                barPercentage: 0.75,
            }
        ],
    };

    const options: ChartOptions<'bar'> = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                titleFont: { size: 15, weight: 'bold' as const, family: 'system-ui, -apple-system, sans-serif' },
                bodyFont: { size: 13, family: 'system-ui, -apple-system, sans-serif' },
                padding: 14,
                cornerRadius: 10,
                displayColors: false,
                callbacks: {
                    title: (context) => {
                        return sortedData[context[0].dataIndex].name;
                    },
                    label: (context) => {
                        const faculty = sortedData[context.dataIndex];
                        return [
                            `ดัชนีความเสี่ยง: ${faculty.riskScore.toFixed(1)} / 5.0`,
                            `เคสความเสี่ยงสูง: ${faculty.activeCases} คน`,
                            `นิสิตทั้งหมด: ${faculty.students.toLocaleString()} คน`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: "rgba(241, 245, 249, 0.8)",
                    // drawBorder: false,
                },
                ticks: {
                    font: {
                        family: 'system-ui, -apple-system, sans-serif',
                        size: 12,
                        weight: 'bold' as const
                    },
                    color: "#94a3b8",
                    padding: 8
                },
                title: {
                    display: true,
                    text: 'จำนวนเคสที่ดูแล (Cases)',
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
        <Card className="h-full border-none shadow-2xl rounded-[2rem] bg-gradient-to-br from-white to-slate-50">
            <CardContent className="p-10 h-full flex flex-col">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-indigo-50 rounded-xl">
                                <LayoutGrid size={22} className="text-indigo-600" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                ดัชนีความเสี่ยงทุกคณะ
                            </h3>
                        </div>
                        <p className="text-sm text-slate-500 font-medium ml-[52px] leading-relaxed">
                            เรียงตามความเสี่ยง (สูง → ต่ำ) • แสดงระดับความเสี่ยงของแต่ละคณะ (0-5)
                        </p>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-5 items-center bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-md bg-rose-500 shadow-sm" />
                            <span className="text-xs font-bold text-slate-600">เสี่ยงสูง</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-md bg-amber-500 shadow-sm" />
                            <span className="text-xs font-bold text-slate-600">ปานกลาง</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm" />
                            <span className="text-xs font-bold text-slate-600">ปกติ</span>
                        </div>
                    </div>
                </div>

                {/* Chart Container */}
                <div className="flex-1 min-h-[650px] w-full bg-white rounded-2xl p-6 border border-slate-100">
                    <Bar data={chartData} options={options} />
                </div>

                {/* Footer Insight */}
                <div className="mt-6 flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-amber-900 mb-1">ข้อสังเกต</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            คณะที่มีความเสี่ยงสูง (สีแดง) ควรได้รับการติดตามเป็นพิเศษ
                            และอาจต้องเพิ่มทรัพยากรหรือมาตรการสนับสนุนเพิ่มเติม
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
