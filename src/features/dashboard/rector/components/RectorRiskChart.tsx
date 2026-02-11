"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface RiskTrendItem {
    month: string;
    averageRisk: number;
}

interface Props {
    data: RiskTrendItem[];
}

export function RectorRiskChart({ data }: Props) {
    const chartData = {
        labels: data.map((d) => d.month),
        datasets: [
            {
                label: "ระดับความเสี่ยงเฉลี่ย (Average Risk)",
                data: data.map((d) => d.averageRisk),
                borderColor: "rgb(244, 63, 94)", // Rose 500
                backgroundColor: "rgba(244, 63, 94, 0.5)",
                tension: 0.3,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                min: 0,
                max: 5,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    return (
        <div className="h-full min-h-[300px]">
            {data.length > 0 ? (
                <Line options={options} data={chartData} />
            ) : (
                <div className="h-48 flex items-center justify-center text-slate-400">
                    ยังไม่มีข้อมูลเพียงพอ
                </div>
            )}
        </div>
    );
}
