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
import { TrendingUp, TrendingDown } from "lucide-react";
import { StrategicMockData } from "../../mocks/strategic-data";

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

export function YoYRiskTrendChart() {
    const data = {
        labels: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
        datasets: [
            {
                label: "ปีนี้ (2568)",
                data: StrategicMockData.trends.monthlyData.currentYear,
                borderColor: "#6366F1", // Indigo
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderWidth: 3,
            },
            {
                label: "ปีก่อน (2567)",
                data: StrategicMockData.trends.monthlyData.lastYear,
                borderColor: "#94A3B8", // Slate-400
                backgroundColor: "transparent",
                borderDash: [5, 5],
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2,
            }
        ],
    };

    const isIncreasing = StrategicMockData.trends.trend === "increasing";

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
            }
        },
        scales: {
            x: { display: false },
            y: { display: false } // Minimalist look
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
    };

    return (
        <Card className="h-full border-none shadow-sm rounded-[2rem] bg-white overflow-hidden relative group hover:shadow-md transition-all">
            <CardContent className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4 z-10">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 font-sans">แนวโน้มเทียบปีก่อน (YoY)</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-3xl font-black text-slate-800">
                                {isIncreasing ? "+" : "-"}{StrategicMockData.trends.percentChange}%
                            </span>
                            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-bold ${isIncreasing ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"}`}>
                                {isIncreasing ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                {isIncreasing ? "สูงขึ้น" : "ลดลง"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-[60%] w-full opacity-80">
                    <Line data={data} options={options} />
                </div>
            </CardContent>
        </Card>
    );
}
