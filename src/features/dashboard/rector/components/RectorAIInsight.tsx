"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Sparkles, BrainCircuit } from "lucide-react";

export function RectorAIInsight() {
    return (
        <Card className="border-rose-100 bg-rose-50/30 overflow-hidden relative">
            <div className="absolute -top-6 -right-6 opacity-10">
                <BrainCircuit className="w-32 h-32 text-rose-500" />
            </div>

            <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-rose-600 mb-1">
                    <Sparkles className="w-4 h-4 fill-rose-600" />
                    <span className="text-xs font-bold uppercase tracking-widest">คำแนะนำโดย Wellness AI</span>
                </div>
                <CardTitle className="text-lg text-slate-900">แนวทางการช่วยเหลือ (ENG)</CardTitle>
                <CardDescription className="text-slate-600">
                    จากการวิเคราะห์ข้อมูลเชิงลึกรายคณะประจำสัปดาห์
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 relative z-10">
                <div className="bg-white/80 rounded-xl p-4 shadow-sm border border-rose-50">
                    <p className="text-sm text-slate-700 leading-relaxed italic">
                        "พบว่าในสัปดาห์นี้ คณะวิศวกรรมศาสตร์ มีสัดส่วนของนิสิตที่เครียดจากการเรียนสูงขึ้นอย่างมีนัยสำคัญ แนะนำให้จัดกิจกรรมผ่อนคลายหรือเพิ่มช่วงเวลาการให้คำปรึกษาในช่วงปี 3-4 ในช่วยเตรียมสอบ"
                    </p>
                    <div className="mt-2 flex justify-end">
                        <span className="text-[10px] text-rose-400 font-medium tracking-tighter">— ข้อมูลสรุปรายสัปดาห์</span>
                    </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center font-medium">
                    Wellness AI ปรุงปรุงข้อมูลล่าสุดเมื่อ 5 นาทีที่แล้ว
                </div>
            </CardContent>
        </Card>
    );
}
