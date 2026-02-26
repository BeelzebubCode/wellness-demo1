"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Info } from "lucide-react";

interface TherapistResourceChartProps {
    data?: {
        internal: number;
        external: number;
        total: number;
    };
}

export function TherapistResourceChart({ data }: TherapistResourceChartProps) {
    if (!data || data.total === 0) {
        return (
            <Card className="border-none shadow-sm bg-white h-full">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        📊 แหล่งทรัพยากรผู้ให้คำปรึกษา
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                    <p>ไม่มีข้อมูลการใช้ทรัพยากรในข่วงเวลานี้</p>
                </CardContent>
            </Card>
        );
    }

    const chartData = [
        { name: "บุคลากรภายใน (Internal)", value: data.internal, color: "#10b981" }, // Emerald
        { name: "บุคลากรยืมตัว (Borrowed)", value: data.external, color: "#3b82f6" }, // Blue
    ];

    const internalPercent = Math.round((data.internal / data.total) * 100);

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden h-full flex flex-col pt-2">
            <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        📊 แหล่งทรัพยากรผู้ให้คำปรึกษา
                    </div>
                    <div className="text-xs font-normal text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                        <Info className="w-3 h-3 text-blue-500" />
                        สัดส่วนการใช้บุคลากรภายนอก
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 h-[350px] relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-bold text-slate-800">{internalPercent}%</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">INTERNAL</span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white/95 backdrop-blur-sm border border-slate-100 p-3 rounded-xl shadow-xl">
                                            <p className="font-bold text-slate-800 text-sm mb-1">{data.name}</p>
                                            <p className="text-slate-500 text-xs flex items-center justify-between gap-4">
                                                จำนวนเคส: <span className="font-semibold text-slate-800">{data.value} เคส</span>
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            formatter={(value, entry: any) => (
                                <span className="text-sm font-medium text-slate-600 ml-1">
                                    {value}
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
            <div className="px-6 pb-6 pt-0">
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100/50">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Total Capacity Used</p>
                        <p className="text-xl font-bold text-slate-800">{data.total} <span className="text-sm font-normal text-slate-500">Bookings</span></p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-semibold text-slate-600">{data.external} External</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-semibold text-slate-600">{data.internal} Internal</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
