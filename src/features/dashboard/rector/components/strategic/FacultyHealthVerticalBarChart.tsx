"use client";

import { Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";

ChartJS.register(ArcElement, Title, Tooltip, Legend);

interface FacultyData {
    name: string;
    riskScore: number;
    activeCases: number;
}

interface FacultyHealthVerticalBarChartProps {
    data?: any[];
}

export function FacultyHealthVerticalBarChart({ data: externalData }: FacultyHealthVerticalBarChartProps) {
    // Mock data for top 5 risky faculties
    const mockData = [
        { name: "วิศวกรรมศาสตร์", riskScore: 4.2 },
        { name: "สถาปัตยกรรมศาสตร์", riskScore: 3.8 },
        { name: "พาณิชยศาสตร์ฯ", riskScore: 3.5 },
        { name: "นิเทศศาสตร์", riskScore: 3.2 },
        { name: "วิทยาศาสตร์", riskScore: 2.9 }
    ];

    const chartData = {
        labels: mockData.map(f => f.name),
        datasets: [
            {
                label: "Risk Index",
                data: mockData.map(f => f.riskScore),
                backgroundColor: [
                    "#F43F5E", // Rose - High Risk (วิศวกรรมศาสตร์)
                    "#FB923C", // Orange-400 (สถาปัตยกรรมศาสตร์)
                    "#FBBF24", // Amber-400 (พาณิชยศาสตร์)
                    "#4ADE80", // Green-400 (นิเทศศาสตร์)
                    "#10B981"  // Emerald-500 - Low Risk (วิทยาศาสตร์)
                ],
                borderColor: "#ffffff",
                borderWidth: 3,
                hoverOffset: 10,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%', // Makes it a doughnut chart
        plugins: {
            legend: {
                display: true,
                position: 'bottom' as const,
                labels: {
                    boxWidth: 12,
                    boxHeight: 12,
                    padding: 12,
                    font: {
                        size: 11,
                        family: 'system-ui, -apple-system, sans-serif',
                        weight: 'bold' as const
                    },
                    color: '#475569',
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: "#1e293b",
                padding: 12,
                cornerRadius: 8,
                bodyFont: {
                    size: 13,
                    weight: 600
                },
                callbacks: {
                    label: (ctx: any) => {
                        const label = ctx.label || '';
                        const value = ctx.parsed || 0;
                        return `${label}: ${value.toFixed(1)}`;
                    }
                }
            }
        }
    };

    return (
        <Card className="h-full border-none shadow-2xl rounded-[2rem] bg-white">
            <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-rose-50 rounded-lg">
                        <AlertTriangle size={20} className="text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700">Top 5 Risky Faculties</h3>
                        <p className="text-xs text-slate-400">คณะที่มีความเสี่ยงสูงสุด</p>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-[200px] flex items-center justify-center">
                    <div className="w-full max-w-[280px] h-[280px]">
                        <Doughnut data={chartData} options={options} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
