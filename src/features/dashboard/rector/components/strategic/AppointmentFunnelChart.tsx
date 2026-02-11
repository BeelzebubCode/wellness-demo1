"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { ArrowRight, Filter } from "lucide-react";
import { StrategicMockData } from "../../mocks/strategic-data";

export function AppointmentFunnelChart() {
    const { funnel } = StrategicMockData;

    const steps = [
        { label: "คำร้องขอ", count: funnel.requested, color: "bg-slate-200 text-slate-600", width: "100%" },
        { label: "นัดหมายสำเร็จ", count: funnel.booked, color: "bg-indigo-100 text-indigo-600", width: "80%" },
        { label: "เข้าพบจริง", count: funnel.completed, color: "bg-indigo-500 text-white", width: "70%" },
        { label: "ติดตามผล", count: funnel.followUpCompleted, color: "bg-emerald-500 text-white", width: "40%" },
    ];

    return (
        <Card className="h-full border-none shadow-sm rounded-[2rem] bg-white">
            <CardContent className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <Filter size={16} />
                        ประสิทธิภาพระบบบริการ (Service Funnel)
                    </h3>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-1">
                    {steps.map((step, index) => (
                        <div key={index} className="w-full flex flex-col items-center relative group">
                            <div
                                className={`h-10 rounded-xl flex items-center justify-between px-4 text-xs font-bold transition-all hover:scale-[1.02] ${step.color}`}
                                style={{ width: step.width }}
                            >
                                <span>{step.label}</span>
                                <span>{step.count.toLocaleString()}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="h-4 w-0.5 bg-slate-200 my-0.5" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex justify-between text-[10px] text-slate-400 font-medium px-4">
                    <span>Conversion: {Math.round((funnel.completed / funnel.requested) * 100)}%</span>
                    <span>Drop-off: {Math.round((1 - (funnel.completed / funnel.requested)) * 100)}%</span>
                </div>
            </CardContent>
        </Card>
    );
}
