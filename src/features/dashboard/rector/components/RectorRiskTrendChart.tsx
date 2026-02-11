"use client";

import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";
import { Card, CardContent } from "@/components/ui/Card";
import { MoreHorizontal } from "lucide-react";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export function RectorRiskTrendChart() {
    const data = {
        labels: ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."],
        datasets: [
            {
                label: "ความเสี่ยงสูง",
                data: [12, 19, 15, 25, 22, 30, 28],
                borderColor: "#6366F1", // Indigo-500
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, "rgba(99, 102, 241, 0.2)"); // Soft Indigo
                    gradient.addColorStop(1, "rgba(99, 102, 241, 0.0)");
                    return gradient;
                },
                fill: true,
                tension: 0.4, // Smooth curve
                pointRadius: 0, // Hidden by default (minimalist)
                pointHoverRadius: 6,
                pointBackgroundColor: "#fff",
                pointBorderColor: "#6366F1",
                pointBorderWidth: 3,
                borderWidth: 3,
            },
            {
                label: "ปกติ",
                data: [8, 12, 10, 18, 15, 22, 20],
                borderColor: "#CBD5E1", // Slate-300 (Subtle)
                backgroundColor: "transparent",
                borderDash: [6, 6],
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2,
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#fff",
                titleColor: "#1e293b",
                bodyColor: "#475569",
                borderColor: "#e2e8f0",
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                usePointStyle: true,
                titleFont: { family: 'sans-serif', size: 13, weight: 'bold' },
                bodyFont: { family: 'sans-serif', size: 12 },
                callbacks: {
                    labelColor: (context: any) => {
                        return {
                            borderColor: context.dataset.borderColor,
                            backgroundColor: context.dataset.borderColor,
                        };
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: "#94a3b8",
                    font: { size: 11, family: 'sans-serif', weight: '500' },
                    padding: 10
                },
                border: { display: false }
            },
            y: {
                grid: {
                    color: "#f1f5f9",
                    borderDash: [4, 4],
                    drawBorder: false,
                },
                ticks: {
                    color: "#94a3b8",
                    font: { size: 10, family: 'sans-serif' },
                    maxTicksLimit: 5,
                    padding: 10
                },
                border: { display: false }
            },
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
    };

    return (
        <Card className="h-full border-none shadow-sm shadow-blue-gray-100 rounded-[2rem] bg-white overflow-hidden">
            <CardContent className="p-8 h-full flex flex-col font-sans">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">แนวโน้มความเสี่ยง (Risk Trends)</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">ภาพรวมความเสี่ยงของนิสิตรายสัปดาห์</p>
                    </div>
                    <button className="p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="flex-1 relative w-full min-h-[200px]">
                    <Line data={data} options={options} />
                </div>

                <div className="flex items-center gap-6 mt-6 justify-center">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" />
                        <span className="text-xs font-bold text-slate-600">ความเสี่ยงสูง</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                        <span className="text-xs font-bold text-slate-400">ปกติ</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
