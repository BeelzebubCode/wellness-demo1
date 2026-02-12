"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { GraduationCap, BrainCircuit, Users } from "lucide-react";

interface RectorExecutiveSummaryProps {
    stats: {
        yearLevelDistribution: {
            YEAR_1: number;
            YEAR_2: number;
            YEAR_3: number;
            YEAR_4: number;
            YEAR_5_PLUS: number;
            UNKNOWN: number;
        };
        problemStats: Record<string, number>;
        genderProblemStats: Record<string, Record<string, number>>;
    };
}

export function RectorExecutiveSummary({ stats }: RectorExecutiveSummaryProps) {
    // 1. Find Top Year Level
    let topYear = "N/A";
    let topYearCount = 0;
    const yearMapping: Record<string, string> = {
        YEAR_1: "ชั้นปีที่ 1",
        YEAR_2: "ชั้นปีที่ 2",
        YEAR_3: "ชั้นปีที่ 3",
        YEAR_4: "ชั้นปีที่ 4",
        YEAR_5_PLUS: "ปี 5 ขึ้นไป"
    };

    if (stats.yearLevelDistribution) {
        Object.entries(stats.yearLevelDistribution).forEach(([key, count]) => {
            if (key !== 'UNKNOWN' && count > topYearCount) {
                topYearCount = count;
                topYear = yearMapping[key] || key;
            }
        });
    }

    // 2. Find Top Problem
    let topProblem = "ไม่มีข้อมูล";
    let topProblemCount = 0;
    if (stats.problemStats) {
        Object.entries(stats.problemStats).forEach(([problem, count]) => {
            if (count > topProblemCount) {
                topProblemCount = count;
                topProblem = problem;
            }
        });
    }

    // 3. Gender Ratio (Male, Female, Other)
    let totalMale = 0;
    let totalFemale = 0;
    let totalOther = 0;

    if (stats.genderProblemStats) {
        if (stats.genderProblemStats.Male) {
            totalMale = Object.values(stats.genderProblemStats.Male).reduce((a, b) => a + b, 0);
        }
        if (stats.genderProblemStats.Female) {
            totalFemale = Object.values(stats.genderProblemStats.Female).reduce((a, b) => a + b, 0);
        }
        if (stats.genderProblemStats.Other) {
            totalOther = Object.values(stats.genderProblemStats.Other).reduce((a, b) => a + b, 0);
        }
    }

    const totalGender = totalMale + totalFemale + totalOther;

    const malePercent = totalGender > 0 ? ((totalMale / totalGender) * 100).toFixed(0) : "0";
    const femalePercent = totalGender > 0 ? ((totalFemale / totalGender) * 100).toFixed(0) : "0";
    const otherPercent = totalGender > 0 ? ((totalOther / totalGender) * 100).toFixed(0) : "0";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">สรุปประเด็นเชิงกลยุทธ์มหาวิทยาลัย</h2>
                    <p className="text-sm text-slate-500">ข้อมูลเชิงลึกระดับมหาวิทยาลัยเพื่อการวางแผนเชิงรุก</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Top Year Level - Blue/Cyan Gradient */}
                <Card className="border-none shadow-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-500 opacity-100 transition-all duration-300 group-hover:scale-105"></div>
                    <CardContent className="relative p-6 text-white h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-blue-100 mb-1">
                                <GraduationCap className="w-5 h-5" />
                                <span className="text-sm font-medium">กลุ่มที่เข้าถึงสูงสุด</span>
                            </div>
                            <h3 className="text-3xl font-black tracking-tight mt-2">{topYear}</h3>
                            <p className="text-blue-100 text-sm mt-1">จำนวน {topYearCount.toLocaleString()} คน</p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between">
                            <span className="text-xs font-medium text-blue-50 bg-white/10 px-2 py-1 rounded">
                                จากสถิติทั้งมหาวิทยาลัย
                            </span>
                            <GraduationCap className="w-12 h-12 text-white/10 absolute bottom-4 right-4" />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Top Problem - Orange/Amber Gradient */}
                <Card className="border-none shadow-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 opacity-100 transition-all duration-300 group-hover:scale-105"></div>
                    <CardContent className="relative p-6 text-white h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-orange-100 mb-1">
                                <BrainCircuit className="w-5 h-5" />
                                <span className="text-sm font-medium">ปัญหาที่พบมากที่สุด</span>
                            </div>
                            <h3 className="text-2xl font-black tracking-tight mt-2 leading-tight min-h-[4rem] flex items-center" title={topProblem}>
                                {topProblem}
                            </h3>
                            <p className="text-orange-100 text-sm mt-1">จำนวน {topProblemCount.toLocaleString()} เคส</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                            <span className="text-xs font-medium text-orange-50 bg-white/10 px-2 py-1 rounded">
                                ความกังวลระดับนโยบาย
                            </span>
                            <BrainCircuit className="w-12 h-12 text-white/10 absolute bottom-4 right-4" />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Gender Ratio - Slate/Gray Gradient */}
                <Card className="border-none shadow-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-600 opacity-100 transition-all duration-300 group-hover:scale-105"></div>
                    <CardContent className="relative p-6 text-white h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-slate-300 mb-1">
                                <Users className="w-5 h-5" />
                                <span className="text-sm font-medium">สัดส่วนผู้ขอรับคำปรึกษา</span>
                            </div>

                            <div className="mt-4 flex flex-col gap-3">
                                {/* Male */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-300">
                                        <span>ชาย</span>
                                        <span>{malePercent}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-400" style={{ width: `${malePercent}%` }}></div>
                                    </div>
                                </div>
                                {/* Female */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-300">
                                        <span>หญิง</span>
                                        <span>{femalePercent}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-pink-400" style={{ width: `${femalePercent}%` }}></div>
                                    </div>
                                </div>
                                {/* Other */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-300">
                                        <span>อื่นๆ</span>
                                        <span>{otherPercent}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-400" style={{ width: `${otherPercent}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between text-xs text-slate-300">
                                <span>รวม {totalGender.toLocaleString()} คน</span>
                                <div className="flex gap-2">
                                    <span title={`ชาย: ${totalMale}`} className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> ช</span>
                                    <span title={`หญิง: ${totalFemale}`} className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div> ญ</span>
                                    <span title={`อื่นๆ: ${totalOther}`} className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div> อ</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
