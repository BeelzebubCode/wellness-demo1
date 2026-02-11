"use client";

import { Card, CardContent } from "@/components/ui/Card";

export function ProcessEfficiencySection() {
    return (
        <div className="space-y-6 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
                จุดที่ระบบมีปัญหา
            </h2>

            <Card className="border-none shadow-sm bg-white">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">
                        นิสิตที่ประเมินผลหลังการรักษา
                    </h3>
                    <div className="text-8xl font-black text-red-600 mb-4">
                        45%
                    </div>
                    <p className="text-lg text-red-600 font-bold">
                        ต่ำกว่าเกณฑ์มาตรฐาน (80%) → ต้องเร่งแก้ไข
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
