"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function DeanActionItems() {
    return (
        <Card className="border-none shadow-sm bg-white h-full">
            <CardHeader className="border-b border-slate-100 bg-red-50/30">
                <CardTitle className="text-lg font-bold text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    สิ่งที่ต้องดำเนินการเร่งด่วน
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="flex gap-4 items-start p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="min-w-6 pt-1">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-red-900 text-sm">กลุ่มเสี่ยงสูงเพิ่มขึ้น 5% ในเดือนนี้</h4>
                        <p className="text-xs text-red-700 mt-1 leading-relaxed">
                            พบแนวโน้มความเครียดสูงขึ้นในช่วงสอบกลางภาค แนะนำให้ประสานงานอาจารย์ที่ปรึกษาเพื่อสอดส่องดูแลนิสิตกลุ่มเสี่ยงอย่างใกล้ชิด
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 items-start p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="min-w-6 pt-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-orange-900 text-sm">อัตราการติดตามผลต่ำกว่าเกณฑ์ในภาควิชา A</h4>
                        <p className="text-xs text-orange-800 mt-1 leading-relaxed">
                            นิสิตจากภาควิชา A มีอัตราการนัดหมายต่อเนื่องต่ำที่สุด อาจต้องพิจารณาแนวทางการเข้าถึงหรือประชาสัมพันธ์เพิ่มเติม
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 items-start p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="min-w-6 pt-1">
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900 text-sm">โครงการ Workshop ได้รับผลตอบรับดี</h4>
                        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                            นิสิต 85% พึงพอใจกับกิจกรรมคลายเครียดที่จัดขึ้นเมื่อสัปดาห์ที่ผ่านมา
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
