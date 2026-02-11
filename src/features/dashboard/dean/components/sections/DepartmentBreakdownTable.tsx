"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Users, BookOpen, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/cn";

interface DepartmentStat {
    departmentId: number;
    departmentCode: string;
    departmentName: string;
    studentCount: number;
    bookingCount: number;
}

interface DepartmentBreakdownTableProps {
    stats: DepartmentStat[];
}

export function DepartmentBreakdownTable({ stats }: DepartmentBreakdownTableProps) {
    // Sort by booking count descending
    const sortedStats = [...stats].sort((a, b) => b.bookingCount - a.bookingCount);

    const totalBookings = stats.reduce((sum, d) => sum + d.bookingCount, 0);
    const totalStudents = stats.reduce((sum, d) => sum + d.studentCount, 0);

    // Metrics for cards
    const topDept = sortedStats[0];
    const deptByRate = [...stats]
        .map(d => ({ ...d, rate: d.studentCount > 0 ? (d.bookingCount / d.studentCount) * 100 : 0 }))
        .sort((a, b) => b.rate - a.rate);
    const highestRateDept = deptByRate[0];
    const lowestRateDept = deptByRate[deptByRate.length - 1];

    return (
        <div className="space-y-6">
            {/* Quick Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">ภาควิชาที่ใช้บริการมากสุด</span>
                        </div>
                        <p className="text-lg font-bold text-slate-800 truncate">{topDept?.departmentName.replace('ภาควิชา', '').trim()}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{topDept?.bookingCount.toLocaleString()} ครั้ง ({totalBookings > 0 ? ((topDept?.bookingCount / totalBookings) * 100).toFixed(1) : 0}%)</p>
                    </CardContent>
                </Card>

                <Card className="border border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">อัตราเข้าถึงสูงสุด</span>
                        </div>
                        <p className="text-lg font-bold text-slate-800 truncate">{highestRateDept?.departmentName.replace('ภาควิชา', '').trim()}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{highestRateDept?.rate.toFixed(1)}% (อาจต้องเพิ่ม capacity)</p>
                    </CardContent>
                </Card>

                <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">อัตราเข้าถึงต่ำสุด</span>
                        </div>
                        <p className="text-lg font-bold text-slate-800 truncate">{lowestRateDept?.departmentName.replace('ภาควิชา', '').trim()}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{lowestRateDept?.rate.toFixed(1)}% (อาจต้องเพิ่มการเข้าถึง)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card className="border shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-white pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800">
                                เปรียบเทียบภาควิชา
                            </CardTitle>
                            <CardDescription>
                                รายละเอียดจำนวนนิสิตและการเข้าใช้บริการรายภาควิชา
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Users className="h-3.5 w-3.5" />
                            <span>{stats.length} ภาควิชา</span>
                            <span className="mx-1">·</span>
                            <span>{totalStudents.toLocaleString()} นิสิตทั้งหมด</span>
                        </div>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 font-semibold w-[50px]">#</th>
                                <th className="px-6 py-3 font-semibold">ภาควิชา</th>
                                <th className="px-6 py-3 font-semibold text-right">จำนวนนิสิต</th>
                                <th className="px-6 py-3 font-semibold text-right">จำนวนครั้งที่ใช้บริการ</th>
                                <th className="px-6 py-3 font-semibold w-[30%]">อัตราการเข้าถึง (Access Rate)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedStats.map((dept, index) => {
                                const rate = dept.studentCount > 0
                                    ? (dept.bookingCount / dept.studentCount) * 100
                                    : 0;
                                const shortName = dept.departmentName.replace('ภาควิชา', '').trim();

                                return (
                                    <tr key={dept.departmentId} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{index + 1}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {shortName}
                                            <span className="block text-[10px] text-slate-400 font-normal">{dept.departmentCode}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600 tabular-nums">
                                            {dept.studentCount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums">
                                            <span className="font-bold text-blue-600">{dept.bookingCount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            rate > 50 ? "bg-amber-500" : "bg-blue-500"
                                                        )}
                                                        style={{ width: `${Math.min(rate, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700 w-[40px] text-right">
                                                    {rate.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
