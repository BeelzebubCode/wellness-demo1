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
import { Users } from "lucide-react";
import { StrategicMockData } from "../../mocks/strategic-data";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function DemographicRiskChart() {
    const { demographics } = StrategicMockData;

    const data = {
        labels: demographics.labels,
        datasets: [
            {
                label: "ความเสี่ยงสูง",
                data: demographics.datasets[0].data,
                backgroundColor: "#F43F5E", // Rose-500
                borderRadius: 4,
            },
            {
                label: "เสี่ยงปานกลาง",
                data: demographics.datasets[1].data,
                backgroundColor: "#F59E0B", // Amber-500
                borderRadius: 4,
            },
            {
                label: "ปกติ",
                data: demographics.datasets[2].data,
                backgroundColor: "#10B981", // Emerald-500
                borderRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { family: 'sans-serif', size: 11 }
                }
            },
            tooltip: {
                backgroundColor: "#1e293b",
                titleFont: { family: 'sans-serif', size: 13 },
                bodyFont: { family: 'sans-serif', size: 12 },
                padding: 10,
                cornerRadius: 8,
            }
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                ticks: { font: { family: 'sans-serif' } }
            },
            y: {
                stacked: true,
                grid: { color: "#f1f5f9" },
                border: { display: false }
            }
        },
    };

    return (
        <Card className="h-full border-none shadow-sm rounded-[2rem] bg-white">
            <CardContent className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <Users size={16} />
                        ความเสี่ยงจำแนกตามชั้นปี
                    </h3>
                </div>
                <div className="flex-1 min-h-[200px]">
                    <Bar data={data} options={options} />
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                    นิสิตปี 1 และ ปี 4+ มีแนวโน้มความเสี่ยงสูงกว่ากลุ่มอื่น
                </p>
            </CardContent>
        </Card>
    );
}
