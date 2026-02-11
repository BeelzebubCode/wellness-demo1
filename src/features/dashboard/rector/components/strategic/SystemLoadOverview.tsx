"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Activity, Clock, Zap, AlertTriangle } from "lucide-react";
import { StrategicMockData } from "../../mocks/strategic-data";

export function SystemLoadOverview() {
    const { capacity } = StrategicMockData;

    // Status Logic
    const isOverloaded = capacity.currentLoad > 80;
    const isWaitTimeHigh = capacity.avgWaitTime > 3;

    return (
        <div className="grid grid-cols-2 gap-4 h-full">
            {/* Q2: System Capacity */}
            <Card className={`border-none shadow-sm rounded-[2rem] ${isOverloaded ? "bg-red-50" : "bg-white"} transition-colors`}>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-bold ${isOverloaded ? "text-red-400" : "text-slate-400"}`}>โหลดระบบ</span>
                        <Activity size={20} className={isOverloaded ? "text-red-500" : "text-blue-500"} />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-black ${isOverloaded ? "text-red-600" : "text-slate-800"}`}>
                                {capacity.currentLoad}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${isOverloaded ? "bg-red-500" : "bg-blue-500"}`}
                                style={{ width: `${capacity.currentLoad}%` }}
                            />
                        </div>
                        <p className={`text-xs mt-2 font-medium ${isOverloaded ? "text-red-500" : "text-slate-400"}`}>
                            {isOverloaded ? "เสี่ยงเกินขีดจำกัด!" : "สถานะปกติ"}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Q3: Wait Time */}
            <Card className="border-none shadow-sm rounded-[2rem] bg-white">
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

            {/* Q9: Emergency Readiness */}
            <Card className="col-span-2 border-none shadow-sm rounded-[2rem] bg-indigo-600 text-white">
                <CardContent className="p-6 flex items-center justify-between h-full">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={20} className="text-yellow-300 fill-yellow-300" />
                            <span className="text-sm font-bold text-indigo-200">ความพร้อมฉุกเฉิน (Emergency Ready)</span>
                        </div>
                        <h3 className="text-2xl font-black">
                            {capacity.emergencyReadiness ? "พร้อมรับมือทันที" : "ไม่พร้อม"}
                        </h3>
                        <p className="text-xs text-indigo-200 mt-1">
                            ทีมฉุกเฉินสแตนด์บาย {capacity.emergencyTeamAvailable} ท่าน
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-lg hover:bg-indigo-50 transition-colors">
                        เรียกทีมฉุกเฉิน
                    </button>
                </CardContent>
            </Card>
        </div>
    );
}
