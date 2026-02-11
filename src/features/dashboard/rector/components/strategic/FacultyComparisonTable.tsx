"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { StrategicMockData } from "../../mocks/strategic-data";

export function FacultyComparisonTable() {
    const { facultyDetails } = StrategicMockData;

    return (
        <Card className="h-full border-none shadow-sm rounded-[2rem] bg-white">
            <CardContent className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-500">
                        เจาะลึก 5 คณะความเสี่ยงสูง (Top High Risk Faculties)
                    </h3>
                    <button className="text-xs text-indigo-500 font-bold hover:underline">ดูทั้งหมด</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-400 border-b border-slate-100">
                                <th className="pb-3 font-medium font-sans pl-2">คณะ</th>
                                <th className="pb-3 font-medium text-center">Risk Index</th>
                                <th className="pb-3 font-medium text-right">เคสactive</th>
                                <th className="pb-3 font-medium text-right pr-2">แนวโน้ม</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-600">
                            {facultyDetails.map((faculty, index) => (
                                <tr key={index} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 pl-2 font-bold text-slate-800">{faculty.name}</td>
                                    <td className="py-3 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${faculty.riskScore >= 4 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {faculty.riskScore}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">{faculty.activeCases}</td>
                                    <td className="py-3 pr-2 flex justify-end">
                                        {faculty.trend === "up" && <ArrowUpRight size={16} className="text-rose-500" />}
                                        {faculty.trend === "down" && <ArrowDownRight size={16} className="text-emerald-500" />}
                                        {faculty.trend === "stable" && <Minus size={16} className="text-slate-400" />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
