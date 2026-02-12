// features/dashboard/head-consultant/components/ConsultantRatingTable.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { Star, MessageSquare } from "lucide-react";
import type { ConsultantRating } from "../hooks/useHeadConsultantDashboard";

interface Props {
    ratings: ConsultantRating[];
}

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }, (_, i) => {
                const filled = score >= i + 1;
                const half = !filled && score > i && score < i + 1;
                return (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${filled
                                ? "text-amber-400 fill-amber-400"
                                : half
                                    ? "text-amber-400 fill-amber-200"
                                    : "text-gray-200 fill-gray-200"
                            }`}
                    />
                );
            })}
        </div>
    );
}

export function ConsultantRatingTable({ ratings }: Props) {
    // Sort by rating desc
    const sorted = [...ratings].sort((a, b) => b.avgRating - a.avgRating);

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Star className="h-5 w-5" />
                </div>
                <div>
                    <CardTitle className="text-base">คะแนนผู้ให้คำปรึกษา</CardTitle>
                    <CardDescription>คะแนนเฉลี่ยจาก Feedback ของนิสิต</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {sorted.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีข้อมูล</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 pr-4 font-medium text-gray-500">ชื่อ</th>
                                    <th className="text-center py-2 px-3 font-medium text-gray-500">ฟีดแบค</th>
                                    <th className="text-center py-2 px-3 font-medium text-gray-500">คะแนน</th>
                                    <th className="text-right py-2 pl-3 font-medium text-gray-500">ระดับ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((c) => (
                                    <tr key={c.consultantId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                    {c.firstName.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-800 truncate">
                                                    {c.prefix}{c.firstName} {c.lastName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <div className="inline-flex items-center gap-1 text-gray-500">
                                                <MessageSquare className="h-3.5 w-3.5" />
                                                <span className="tabular-nums">{c.feedbackCount}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <span className="font-semibold text-gray-900 tabular-nums">{c.avgRating.toFixed(1)}</span>
                                        </td>
                                        <td className="py-3 pl-3">
                                            <div className="flex justify-end">
                                                <StarRating score={c.avgRating} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
