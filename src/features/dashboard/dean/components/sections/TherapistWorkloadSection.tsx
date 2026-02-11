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

interface TherapistWorkloadSectionProps {
    consultantStats: Array<{
        id: number;
        name: string;
        count: number;
    }>;
    academicYear?: string;
}

export function TherapistWorkloadSection({ consultantStats, academicYear }: TherapistWorkloadSectionProps) {
    if (!consultantStats || consultantStats.length === 0) {
        return null;
    }

    const labels = consultantStats.map(c => c.name);
    const dataValues = consultantStats.map(c => c.count);

    // Gradient colors or simple distinct colors
    const backgroundColors = dataValues.map((v, i) => i === 0 ? '#3b82f6' : '#cbd5e1'); // Top 1 highlighted

    const chartData: ChartData<'bar'> = {
        labels: labels,
        datasets: [
            {
                label: 'จำนวนเคส',
                data: dataValues,
                backgroundColor: backgroundColors,
                borderRadius: 4,
                barThickness: 30,
            },
        ],
    };

    const workloadOptions: ChartOptions<'bar'> = {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.formattedValue} เคส`
                },
                titleFont: { family: 'Noto Sans Thai, sans-serif' },
                bodyFont: { family: 'Noto Sans Thai, sans-serif' }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { display: false },
                ticks: { font: { family: 'Noto Sans Thai, sans-serif' } }
            },
            y: {
                grid: { display: false },
                ticks: {
                    font: { family: 'Noto Sans Thai, sans-serif' },
                    autoSkip: false
                }
            }
        },
        layout: {
            padding: { left: 0, right: 20, top: 0, bottom: 0 }
        }
    };

    const maxCases = Math.max(...dataValues);
    const avgCases = dataValues.reduce((a, b) => a + b, 0) / dataValues.length;
    const isImbalanced = maxCases > (avgCases * 1.5) && avgCases > 0;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">
                ภาระงานของนักจิตบำบัด
            </h2>

            <Card className="border-none shadow-sm bg-white">
                {isImbalanced && (
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-600 flex items-center gap-2">
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                ภาระงานไม่สมดุล
                            </span>
                        </CardTitle>
                    </CardHeader>
                )}
                <CardContent className="h-[300px]">
                    <Bar data={chartData} options={workloadOptions} />
                </CardContent>
            </Card>
        </div>
    );
}
