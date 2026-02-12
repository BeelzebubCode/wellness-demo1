// features/dashboard/head-consultant/components/ProblemCategoryChart.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { FolderKanban } from "lucide-react";
import type { CategoryItem } from "../hooks/useHeadConsultantDashboard";

const BAR_COLORS = [
    "bg-indigo-500",
    "bg-sky-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-teal-500",
    "bg-orange-500",
];

interface Props {
    categories: CategoryItem[];
}

export function ProblemCategoryChart({ categories }: Props) {
    const maxCount = Math.max(...categories.map((c) => c.count), 1);

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                    <CardTitle className="text-base">ประเภทปัญหา</CardTitle>
                    <CardDescription>สัดส่วน booking แยกตามหมวดปัญหา</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {categories.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีข้อมูล</p>
                ) : (
                    <div className="space-y-3">
                        {categories.map((cat, idx) => (
                            <div key={cat.categoryId} className="group">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                                        {cat.nameTh}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-500 tabular-nums">
                                        {cat.count} เคส
                                    </span>
                                </div>
                                <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[idx % BAR_COLORS.length]}`}
                                        style={{ width: `${(cat.count / maxCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
