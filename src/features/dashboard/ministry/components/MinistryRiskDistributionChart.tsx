"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { ChartCard } from "../../shared/ChartCard";
import type { RiskDistribution } from "../../shared/analytics-types";

ChartJS.register(ArcElement, Tooltip, Legend);

// Maps risk levels to beautiful gradients
const RISK_COLORS = {
    1: ['#10b981', '#34d399'], // Emerald (Low)
    2: ['#3b82f6', '#60a5fa'], // Blue
    3: ['#f59e0b', '#fbbf24'], // Amber (Medium)
    4: ['#f97316', '#fb923c'], // Orange
    5: ['#ef4444', '#f87171'], // Red (High)
};

const RISK_LABELS = {
    1: 'ปกติ (Normal)',
    2: 'เสี่ยงต่ำ (Low)',
    3: 'ปานกลาง (Medium)',
    4: 'เสี่ยงสูง (High)',
    5: 'ฉุกเฉิน (Severe)',
};

export function MinistryRiskDistributionChart({
    data,
    loading,
}: {
    data: RiskDistribution | null;
    loading?: boolean;
}) {
    const chartRef = useRef<ChartJS<"doughnut">>(null);
    const [gradients, setGradients] = useState<CanvasGradient[]>([]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;
        const ctx = chart.ctx;

        const generatedGradients = [1, 2, 3, 4, 5].map(level => {
            const grad = ctx.createLinearGradient(0, 0, 0, 300);
            //@ts-ignore
            grad.addColorStop(0, RISK_COLORS[level][0]);
            //@ts-ignore
            grad.addColorStop(1, RISK_COLORS[level][1]);
            return grad;
        });

        setGradients(generatedGradients);
    }, [data, chartRef.current]);

    // Helper to get count by level safely
    const getCount = (lvl: number) => data?.levels.find(l => l.level === lvl)?.count || 0;

    // Prepare data
    const chartData = {
        labels: [RISK_LABELS[1], RISK_LABELS[2], RISK_LABELS[3], RISK_LABELS[4], RISK_LABELS[5]],
        datasets: [
            {
                data: [
                    getCount(1),
                    getCount(2),
                    getCount(3),
                    getCount(4),
                    getCount(5),
                ],
                backgroundColor: gradients.length > 0 ? gradients : ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 12,
                borderRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%', // Modern thin doughnut
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { family: "'Inter', px-sans", size: 12 },
                    color: '#475569',
                },
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
            },
        },
        animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1500,
            easing: 'easeOutQuart' as const
        }
    };

    return (
        <ChartCard
            title="ระดับความเสี่ยง (Risk Distribution)"
            subtitle="สัดส่วนนิสิตเข้ารับการปรึกษาจำแนกตามความรุนแรง"
            loading={loading}
            isEmpty={!data || data.levels.length === 0}
        >
            <div className="flex flex-col md:flex-row items-center gap-6 h-80 w-full relative">

                {/* 1. KPI Panel */}
                <div className="w-full md:w-1/3 flex flex-col justify-center space-y-4">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-4xl font-black text-slate-800 drop-shadow-sm">
                            {data?.avgRisk ? data.avgRisk.toFixed(1) : "0.0"}
                        </span>
                        <span className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-wide">คะแนนเฉลี่ย (เต็ม 5)</span>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-rose-100 border border-red-200/60 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-3xl font-black text-red-600 drop-shadow-sm">
                            {data?.highRiskRate ? data.highRiskRate.toFixed(1) : "0.0"}%
                        </span>
                        <span className="text-sm text-red-500 font-medium mt-1 uppercase tracking-wide">สัดส่วนเสี่ยงสูง (Level 4-5)</span>
                    </div>
                </div>

                {/* 2. Chart Component */}
                <div className="w-full md:w-2/3 h-full relative">
                    <Doughnut ref={chartRef} data={chartData} options={options} />
                </div>
            </div>
        </ChartCard>
    );
}
