"use client";

import { Bubble } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    ChartOptions
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Info } from "lucide-react";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface FacultyData {
    id: number;
    name: string;
    engagementRate: number;
    riskIndex: number;
    studentCount: number;
    highRiskCount: number;
}

interface RectorFacultyHealthMapProps {
    data: FacultyData[];
    loading?: boolean;
}

export function RectorFacultyHealthMap({ data, loading }: RectorFacultyHealthMapProps) {
    if (loading) return <div className="h-full animate-pulse bg-white/50 rounded-[2rem]" />;

    const chartData = {
        datasets: [
            {
                label: "Faculty Health Status",
                data: data.map(item => ({
                    x: item.engagementRate,
                    y: item.riskIndex,
                    r: Math.max(8, Math.sqrt(item.studentCount) / 1.5), // Slightly larger bubbles
                    faculty: item.name,
                    raw: item
                })),
                backgroundColor: (context: any) => {
                    const val = context.raw;
                    if (!val) return "rgba(203, 213, 225, 0.7)"; // Slate-300
                    // Logic: High Risk > 3.5 -> Rose; Warning > 2.5 -> Amber; Else -> Emerald
                    if (val.y > 3.5 || val.x < 10) return "rgba(244, 63, 94, 0.8)"; // Rose-500
                    if (val.y > 2.5) return "rgba(245, 158, 11, 0.8)"; // Amber-500
                    return "rgba(16, 185, 129, 0.8)"; // Emerald-500
                },
                borderColor: "#fff",
                borderWidth: 2,
                hoverBorderWidth: 4,
                hoverBorderColor: (context: any) => {
                    const val = context.raw;
                    if (!val) return "#94A3B8";
                    if (val.y > 3.5 || val.x < 10) return "#F43F5E";
                    if (val.y > 2.5) return "#F59E0B";
                    return "#10B981";
                }
            },
        ],
    };

    const options: ChartOptions<'bubble'> = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: "อัตราการมีส่วนร่วม (Engagement Rate %)",
                    color: "#94a3b8",
                    font: { size: 11, weight: 'bold' }
                },
                min: 0,
                max: 100,
                grid: {
                    color: "#f1f5f9",
                    tickLength: 0
                },
                ticks: {
                    color: "#64748b",
                    font: { size: 11 }
                },
                border: { display: false }
            },
            y: {
                title: {
                    display: true,
                    text: "ดัชนีความเสี่ยง (Risk Index 1-5)",
                    color: "#94a3b8",
                    font: { size: 11, weight: 'bold' }
                },
                min: 0,
                max: 5,
                grid: {
                    color: "#f1f5f9",
                    tickLength: 0
                },
                ticks: {
                    color: "#64748b",
                    font: { size: 11 },
                    stepSize: 1
                },
                border: { display: false }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#1e293b",
                padding: 12,
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                cornerRadius: 8,
                callbacks: {
                    label: (context: any) => {
                        const raw = context.raw;
                        // Fix for redundant "Faculty of" if backend sends it. 
                        // Assuming raw.faculty is Thai name from backend.
                        return `${raw.faculty}: เสี่ยง ${raw.y}, มีส่วนร่วม ${raw.x}%`;
                    }
                }
            }
        },
        layout: {
            padding: 10
        }
    };

    return (
        <Card className="h-full border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden font-sans">
            <CardContent className="p-8 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            แผนภาพสุขภาพคณะ (Faculty Health Map)
                            <Info className="w-4 h-4 text-slate-300" />
                        </h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">เปรียบเทียบความเสี่ยง vs การมีส่วนร่วมเพื่อค้นหาคณะที่น่าห่วงใย</p>
                    </div>
                    {/* Clean Legend */}
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> <span className="text-[10px] font-bold text-slate-500">เสี่ยงสูง</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> <span className="text-[10px] font-bold text-slate-500">ปานกลาง</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> <span className="text-[10px] font-bold text-slate-500">ปกติ</span></div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 relative w-full">
                    <Bubble data={chartData} options={options} />
                </div>
            </CardContent>
        </Card>
    );
}
