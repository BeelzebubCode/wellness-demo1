"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Clock } from "lucide-react";
import { StrategicMockData } from "../../mocks/strategic-data";

export function SystemLoadOverview() {
    const { capacity } = StrategicMockData;

    // Status Logic
    const isWaitTimeHigh = capacity.avgWaitTime > 3;

    return (
        <div className="h-full">
            {/* Average Wait Time */}
            <Card className="border-none shadow-2xl rounded-[2rem] bg-white h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-slate-400">เวลารอคอยเฉลี่ย</span>
                        <Clock size={20} className={isWaitTimeHigh ? "text-amber-500" : "text-emerald-500"} />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-slate-800">
                                {capacity.avgWaitTime}
                            </span>
                            <span className="text-sm font-bold text-slate-400">วัน</span>
                        </div>
                        <p className={`text-xs mt-2 font-medium ${isWaitTimeHigh ? "text-amber-500" : "text-emerald-500"}`}>
                            {isWaitTimeHigh ? "ควรลดเวลาลง" : "อยู่ในเกณฑ์ดี"}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
