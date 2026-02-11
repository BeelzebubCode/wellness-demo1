"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { MessageCircleWarning } from "lucide-react";
import { StrategicMockData } from "../../mocks/strategic-data";

export function IssueFrequencyChart() {
    const { issues } = StrategicMockData;
    const maxCount = Math.max(...issues.map(i => i.count));

    return (
        <Card className="h-full border-none shadow-sm rounded-[2rem] bg-white">
            <CardContent className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <MessageCircleWarning size={16} />
                        ประเด็นปัญหาที่พบบ่อย (Top Issues)
                    </h3>
                </div>

                <div className="flex-1 flex flex-col justify-center gap-3">
                    {issues.map((issue, index) => (
                        <div key={index} className="w-full">
                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                <span>{index + 1}. {issue.topic}</span>
                                <span>{issue.count} เคส</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{
                                        width: `${(issue.count / maxCount) * 100}%`,
                                        backgroundColor: issue.color
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
