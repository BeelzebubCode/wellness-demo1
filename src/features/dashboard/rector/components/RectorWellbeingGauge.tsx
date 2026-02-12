"use client";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Card, CardContent } from "@/components/ui/Card";

ChartJS.register(ArcElement, Tooltip, Legend);

interface RectorWellbeingGaugeProps {
    score: number;
    loading?: boolean;
}

export function RectorWellbeingGauge({ score, loading }: RectorWellbeingGaugeProps) {
    if (loading) return <div className="h-full animate-pulse bg-white/50 rounded-[2rem]" />;

    // Dynamic Color Logic
    let color = "#10B981"; // Emerald-500 (Green)
    let statusText = "ดีเยี่ยม";
    let statusClass = "text-emerald-500 bg-emerald-50";

    if (score < 50) {
        color = "#F43F5E"; // Rose-500 (Red)
        statusText = "น่าเป็นห่วง";
        statusClass = "text-rose-500 bg-rose-50";
    } else if (score < 80) {
        color = "#F59E0B"; // Amber-500 (Yellow)
        statusText = "ปานกลาง";
        statusClass = "text-amber-500 bg-amber-50";
    }

    const data = {
        labels: ["Score", "Remaining"],
        datasets: [
            {
                data: [score, 100 - score],
                backgroundColor: [
                    color,
                    "#F1F5F9"  // Slate-100 for empty part
                ],
                borderWidth: 0,
                cutout: "75%",
                // ✅ ป้องกัน negative radius: ปรับ borderRadius ให้เล็กลงเมื่อ score น้อย
                borderRadius: Math.min(20, Math.max(score, 100 - score) * 0.3),
                spacing: 0 // เปลี่ยนจาก -10 เป็น 0 เพื่อกันปัญหา
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1500,
            easing: 'easeOutQuart' as const
        },
        rotation: 0,
        circumference: 360,
    };

    return (
        <Card className="h-full border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden font-sans">
            <CardContent className="p-8 flex flex-col items-center justify-between h-full relative">
                <div className="w-full flex justify-between items-center z-10">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">ดัชนีสุขภาวะ (Wellbeing)</h3>
                </div>

                <div className="relative w-48 h-48 my-4 flex items-center justify-center">
                    <div className="relative w-full h-full z-10">
                        <Doughnut data={data} options={options} />
                    </div>

                    {/* Centered Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-5xl font-black text-slate-800 tracking-tighter" style={{ color: color }}>
                            {Math.round(score)}
                        </span>
                        <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusClass}`}>
                            {statusText}
                        </div>
                    </div>
                </div>

                <div className="w-full z-10">
                    <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold transition-all border border-slate-100">
                        ดูรายละเอียดเพิ่มเติม
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
