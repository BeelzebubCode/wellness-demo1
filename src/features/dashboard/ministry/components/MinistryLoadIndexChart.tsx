"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ChartCard } from "../../widgets/cards/ChartCard";
import type { LoadIndexItem } from "../../widgets/types/analytics-types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler);

export function MinistryLoadIndexChart({
    data,
    loading,
    title = "Load Index / ภาระงาน",
    subtitle = "ภาพรวมภาระงานแยกตามสังกัด/ภูมิภาค",
}: {
    data: LoadIndexItem[];
    loading?: boolean;
    title?: string;
    subtitle?: string;
}) {
    const chartRef = useRef<ChartJS<"bar">>(null);
    const [gradientStore, setGradientStore] = useState<{ bg?: CanvasGradient, hoverBg?: CanvasGradient }>({});

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;

        const ctx = chart.ctx;
        // Primary Gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, 400);
        bgGradient.addColorStop(0, 'rgba(14, 165, 233, 0.9)'); // Sky 500
        bgGradient.addColorStop(1, 'rgba(99, 102, 241, 0.2)'); // Indigo 500

        const hoverGradient = ctx.createLinearGradient(0, 0, 0, 400);
        hoverGradient.addColorStop(0, 'rgba(14, 165, 233, 1)'); // Sky 500
        hoverGradient.addColorStop(1, 'rgba(99, 102, 241, 0.6)'); // Indigo 500

        setGradientStore({ bg: bgGradient, hoverBg: hoverGradient });
    }, [data]);

    const chartData = {
        labels: data.map(d => d.groupName).map(n => n.length > 20 ? n.substring(0, 20) + '...' : n),
        datasets: [
            {
                label: 'Load Index',
                data: data.map(d => d.loadIndex),
                backgroundColor: gradientStore.bg || 'rgba(99, 102, 241, 0.8)',
                hoverBackgroundColor: gradientStore.hoverBg || 'rgba(79, 70, 229, 1)',
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 'flex',
                maxBarThickness: 45,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#0f172a',
                bodyColor: '#475569',
                titleFont: { size: 14, family: "'Inter', sans-serif", weight: 'bold' as const },
                bodyFont: { size: 14, family: "'Inter', sans-serif" },
                padding: 14,
                cornerRadius: 12,
                borderColor: 'rgba(226, 232, 240, 1)',
                borderWidth: 1,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                callbacks: {
                    label: (context: any) => `Load Index: ${context.parsed.y.toFixed(1)}`,
                    // Custom tooltip to show full name
                    title: (context: any) => data[context[0].dataIndex]?.groupName || context[0].label
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(241, 245, 249, 1)', // slate-100
                    drawBorder: false,
                },
                ticks: {
                    font: { family: "'Inter', sans-serif", size: 12 },
                    color: '#94a3b8' // slate-400
                }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    font: { family: "'Inter', px-sans", size: 12 },
                    color: '#64748b',
                    maxRotation: 45,
                    minRotation: 0,
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart' as const
        }
    };

    return (
        <ChartCard
            title={title}
            subtitle={subtitle}
            loading={loading}
            isEmpty={!data || data.length === 0}
        >
            <div className="h-80 w-full relative">
                {/* @ts-ignore */}
                <Bar ref={chartRef} data={chartData} options={options} />
            </div>
        </ChartCard>
    );
}
