// features/dashboard/head-consultant/components/TopStudentsCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { Trophy, Coins } from "lucide-react";
import type { TopStudent } from "../hooks/useHeadConsultantDashboard";

interface Props {
    students: TopStudent[];
}

const RANK_STYLES: Record<number, string> = {
    1: "bg-amber-400 text-white",
    2: "bg-gray-300 text-white",
    3: "bg-orange-400 text-white",
};

export function TopStudentsCard({ students }: Props) {
    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Trophy className="h-5 w-5" />
                </div>
                <div>
                    <CardTitle className="text-base">นิสิตแต้มสะสมสูง</CardTitle>
                    <CardDescription>อันดับนิสิตที่มีแต้มสะสมมากที่สุด</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {students.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีข้อมูล</p>
                ) : (
                    <div className="space-y-2">
                        {students.map((s) => (
                            <div
                                key={s.studentId}
                                className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50/80 transition-colors group"
                            >
                                {/* Rank badge */}
                                <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${RANK_STYLES[s.rank] ?? "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    {s.rank}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {s.firstName} {s.lastName}
                                        {s.nickname ? (
                                            <span className="text-gray-400 ml-1">({s.nickname})</span>
                                        ) : null}
                                    </p>
                                    <p className="text-xs text-gray-400">{s.studentCode ?? s.username}</p>
                                </div>

                                {/* Points */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <Coins className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm font-bold text-amber-600 tabular-nums">
                                        {s.points.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
