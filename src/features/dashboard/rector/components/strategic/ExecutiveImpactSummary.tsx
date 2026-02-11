"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { ShieldCheck, Star, Users, CheckCircle } from "lucide-react";
import { StrategicMockData } from "../../mocks/strategic-data";

export function ExecutiveImpactSummary() {
    const { quality, impact } = StrategicMockData;

    return (
        <div className="h-full flex flex-col gap-4 font-sans">
            <h3 className="text-lg font-bold text-slate-800">คุณภาพการให้บริการ (Service Quality)</h3>

            {/* Real Data Hero: Satisfaction (Feedback Table) */}
            <Card className="border-none shadow-md shadow-indigo-100 bg-indigo-600 text-white rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Star size={80} />
                </div>
                <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
                    <div>
                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-widest">ความพึงพอใจนิสิต (Satisfaction)</span>
                        <div className="text-4xl font-black mt-2 mb-1">
                            {impact.avgSatisfaction.toFixed(1)} <span className="text-xl font-medium text-indigo-200">/ 5.0</span>
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-indigo-500/50 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm w-fit">
                        <Users size={14} />
                        จาก {impact.totalCompletedCases.toLocaleString()} เคสที่ดูแลสำเร็จ
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Response Rate */}
                <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                    <CardContent className="p-5 flex flex-col items-center justify-center h-full text-center">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-2">
                            <CheckCircle size={20} />
                        </div>
                        <div className="text-2xl font-black text-slate-800">{impact.responseRate}%</div>
                        <span className="text-[10px] text-slate-400 font-bold">อัตราการตอบรับเคส</span>
                    </CardContent>
                </Card>

                {/* Safety/Compliance */}
                <Card className="border-none shadow-sm rounded-[2rem] bg-slate-50">
                    <CardContent className="p-5 flex flex-col items-center justify-center h-full text-center">
                        <div className="p-3 bg-white text-slate-500 rounded-full mb-2 shadow-sm">
                            <ShieldCheck size={20} />
                        </div>
                        <div className="text-2xl font-black text-slate-600">{quality.criticalIncidents}</div>
                        <span className="text-[10px] text-slate-400 font-bold">ความเสี่ยงเชิงระบบ</span>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
