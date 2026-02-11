"use client";

import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
                backgroundColor: mockData.map(f => {
                    if (f.riskScore >= 4) return "#F43F5E"; // Rose
                    if (f.riskScore >= 3) return "#F59E0B"; // Amber
                    return "#10B981"; // Emerald
                }),
                borderRadius: 8,
                barThickness: 20,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#1e293b",
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (ctx: any) => `Risk Index: ${ctx.raw}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 5,
                grid: { color: "#f1f5f9" },
                border: { display: false }
            },
            x: {
                grid: { display: false },
                border: { display: false }
            }
        }
    };

    return (
        <Card className="h-full border-none shadow-sm rounded-[2rem] bg-white">
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
                <div className="flex-1 w-full min-h-[200px]">
                    <Bar data={chartData} options={options} />
                </div>
            </CardContent>
        </Card>
    );
}
