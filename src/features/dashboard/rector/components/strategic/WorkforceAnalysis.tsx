"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { UserCog, Users, AlertCircle } from "lucide-react";
import { StrategicMockData } from "../../mocks/strategic-data";

export function WorkforceAnalysis() {
    const { workforce } = StrategicMockData;

    return (
        <Card className="h-full border-none shadow-2xl rounded-[2rem] bg-white text-slate-800">
            <CardContent className="p-6 h-full flex flex-col">
                <h3 className="text-base font-bold mb-6 font-sans">วิเคราะห์บุคลากร (Staff Analysis)</h3>

                {/* Q4 Trend: Severe Cases vs Staff Growth */}
                <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-400">การเติบโตของเคสหนัก vs ทีมงาน</span>
                        <AlertCircle size={16} className="text-rose-500" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div>
                            <span className="text-2xl font-black text-rose-500">+{workforce.severeCaseGrowth}%</span>
                            <span className="text-xs block text-slate-400">เคสหนัก</span>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200" />
                        <div>
                            <span className="text-2xl font-black text-slate-600">+{workforce.staffGrowth}%</span>
                            <span className="text-xs block text-slate-400">เพิ่มคน</span>
                        </div>
                    </div>
                    <p className="text-xs text-rose-500 font-bold mt-2">⚠️ คนเพิ่มไม่ทันงานที่หนักขึ้น</p>
                </div>

                {/* Q5 Workload */}
                <div className="mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-slate-500">ภาระงานต่อคน (Caseload)</span>
                        <span className="text-sm font-bold text-rose-500">{workforce.averageCaseload} เคส/คน</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full w-[85%]" />
                    </div>
                    <p className="text-xs text-right text-slate-400 mt-1">Benchmark: 20 เคส</p>
                </div>

                {/* Q6 External vs Internal */}
                <div className="flex-1">
                    <span className="text-sm font-bold text-slate-500 mb-2 block">สัดส่วนการพึ่งพาภายนอก</span>
                    <div className="flex h-12 rounded-xl overflow-hidden text-sm font-bold text-white">
                        <div
                            className="bg-indigo-500 flex items-center justify-center"
                            style={{ width: `${workforce.internalCases}%` }}
                        >
                            ภายใน {workforce.internalCases}%
                        </div>
                        <div
                            className="bg-slate-400 flex items-center justify-center"
                            style={{ width: `${workforce.externalCases}%` }}
                        >
                            นอก {workforce.externalCases}%
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
