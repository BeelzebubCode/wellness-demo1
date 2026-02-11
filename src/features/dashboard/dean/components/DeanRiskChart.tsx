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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";

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

export function DeanRiskChart({ data }: Props) {
    const chartData = {
        labels: data.map((d) => d.month),
        datasets: [
            {
                label: "ระดับความเสี่ยงเฉลี่ย (Average Risk)",
                data: data.map((d) => d.averageRisk),
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.5)",
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
                text: "แนวโน้มความเสี่ยงนิสิต",
            },
        },
        scales: {
            y: {
                min: 0,
                max: 5,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardTitle>แนวโน้มความเสี่ยง (Trend)</CardTitle>
                <CardDescription>ค่าเฉลี่ยความเสี่ยงของนิสิตในคณะย้อนหลัง</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <Line options={options} data={chartData} />
                ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400">
                        ยังไม่มีข้อมูลเพียงพอ
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
