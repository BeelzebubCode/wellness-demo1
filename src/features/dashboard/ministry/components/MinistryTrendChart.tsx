"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ChartCard } from "../../shared/ChartCard";
import type { TrendBucket } from "../../shared/analytics-types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export function MinistryTrendChart({
    data,
    loading,
}: {
    data: TrendBucket[];
    loading?: boolean;
}) {
    const chartRef = useRef<ChartJS<"line">>(null);
    const [gradientStore, setGradientStore] = useState<{ risk?: CanvasGradient, total?: CanvasGradient }>({});

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;
        const ctx = chart.ctx;

        const riskGradient = ctx.createLinearGradient(0, 0, 0, 400);
        riskGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)'); // Red 500
        riskGradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');

        const totalGradient = ctx.createLinearGradient(0, 0, 0, 400);
        totalGradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)'); // Blue 500
        totalGradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

        setGradientStore({ risk: riskGradient, total: totalGradient });
    }, [data, chartRef.current]);

    const formattedData = useMemo(() => {
        // Simple date formatting for 'YYYY-MM-DD' depending on length
        return data.map(d => {
            const dateStr = d.bucket;
            let displayDate = dateStr;
            if (dateStr.length === 10) {
                // Parse YYYY-MM-DD to DD/MM
                const parts = dateStr.split('-');
                if (parts.length === 3) displayDate = `${parts[2]}/${parts[1]}`;
            } else if (dateStr.length === 7) {
                // Parse YYYY-MM to MM/YYYY (Thai Year)
                const parts = dateStr.split('-');
                if (parts.length === 2) displayDate = `${parts[1]}/${parseInt(parts[0]) + 543}`;
            }
            return {
                ...d,
                displayDate
            };
        });
    }, [data]);

    const chartData = {
        labels: formattedData.map(d => d.displayDate),
        datasets: [
            {
                label: 'นิสิตเสี่ยงสูง (Level 4-5)',
                data: formattedData.map(d => d.highRiskCount),
                borderColor: '#ef4444', // Red 500
                backgroundColor: gradientStore.risk || 'rgba(239, 68, 68, 0.1)',
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#ef4444',
                fill: true,
                tension: 0.4, // Smooth curve
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'การรับบริการทั้งหมด',
                data: formattedData.map(d => d.totalBookings),
                borderColor: '#3b82f6', // Blue 500
                backgroundColor: gradientStore.total || 'rgba(59, 130, 246, 0.1)',
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#3b82f6',
                fill: true,
                tension: 0.4, // Smooth curve
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ]
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
                    font: { family: "'Inter', px-sans", size: 12 },
                    color: '#475569',
                }
            },
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
                mode: 'index' as const,
                intersect: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(241, 245, 249, 1)',
                    drawBorder: false,
                },
                ticks: {
                    font: { family: "'Inter', sans-serif", size: 12 },
                    color: '#94a3b8'
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
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart' as const
        }
    };

    const totalHighRisk = data.reduce((sum, item) => sum + item.highRiskCount, 0);

    return (
        <ChartCard
            title="แนวโน้มการรับบริการ (Trends)"
            subtitle={`พบผู้มีความเสี่ยงสูงสะสมในข่วงเวลานี้ ทั้งสิ้น ${totalHighRisk.toLocaleString()} ราย`}
            loading={loading}
            isEmpty={!data || data.length === 0}
        >
            <div className="h-80 w-full relative mt-4">
                <Line ref={chartRef} data={chartData} options={options} />
            </div>
        </ChartCard>
    );
}
