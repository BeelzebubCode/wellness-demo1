"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    ChartData,
    ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip
);

interface ProblemAnalysisSectionProps {
    problemStats: Record<string, number>;
}

export function ProblemAnalysisSection({ problemStats }: ProblemAnalysisSectionProps) {
    // Sort and take Top 3
    const entries = Object.entries(problemStats || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    const labels = entries.map(([k]) => k); // Assuming keys are already Thai e.g. "การเรียน", "ความรัก"
    const values = entries.map(([, v]) => v);

    const chartData: ChartData<'bar'> = {
        labels: labels,
        datasets: [
            {
                data: values,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderRadius: 4,
            },
        ],
    };

    const chartOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.formattedValue} เคส`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { display: false }
            },
            x: {
                grid: { display: false }
            }
        }
    };

    return (
        <div className="space-y-6 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
                นิสิตมาขอความช่วยเหลือเรื่องอะไร
            </h2>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-600">
                        เหตุผลหลักที่พบมากที่สุด (3 อันดับแรก)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <Bar data={chartData} options={chartOptions} />
                </CardContent>
            </Card>
        </div>
    );
}
