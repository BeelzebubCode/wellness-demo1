"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Users, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/cn";

interface FacultyStat {
    facultyName: string;
    studentCount: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    // We only have this in RectorService if we add bookingCount there, 
    // but for now, we can infer activity/risk per capita if needed, 
    // OR we can rely on what we have.
    // The RectorService returns:
    // facultyName, studentCount, highRiskCount, mediumRiskCount, lowRiskCount.
    // We should probably add bookingCount to RectorService to match the "Activity" column properly
    // but for now let's use highRiskCount ratio as defined in Dean logic or just map what we have.
}

// Update: RectorService return type in `facultyBreakdown`:
// { facultyName, studentCount, highRiskCount, mediumRiskCount, lowRiskCount }

interface FacultyBreakdownTableProps {
    stats: FacultyStat[];
}

export function FacultyBreakdownTable({ stats }: FacultyBreakdownTableProps) {
    // Sort by high risk count descending for initial view
    const sortedStats = [...stats].sort((a, b) => b.highRiskCount - a.highRiskCount);

    const totalHighRisk = stats.reduce((sum, d) => sum + d.highRiskCount, 0);
    const totalStudents = stats.reduce((sum, d) => sum + d.studentCount, 0);

    // Metrics for cards
    const topRiskFaculty = sortedStats[0];

    // Risk Rate (High Risk / Student Count)
    const facultyByRiskRate = [...stats]
        .map(d => ({ ...d, rate: d.studentCount > 0 ? (d.highRiskCount / d.studentCount) * 100 : 0 }))
        .sort((a, b) => b.rate - a.rate);

    const highestRiskRateFaculty = facultyByRiskRate[0];
    const lowestRiskRateFaculty = facultyByRiskRate[facultyByRiskRate.length - 1];

    return (
        <div className="space-y-6">
            {/* Quick Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-red-100 bg-gradient-to-br from-red-50 to-white shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            </div>
                            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">เคสเสี่ยงสูงมากสุด</span>
                        </div>
                        <p className="text-lg font-bold text-slate-800 truncate">{topRiskFaculty?.facultyName}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{topRiskFaculty?.highRiskCount.toLocaleString()} ราย ({totalHighRisk > 0 ? ((topRiskFaculty?.highRiskCount / totalHighRisk) * 100).toFixed(1) : 0}%)</p>
                    </CardContent>
                </Card>

                <Card className="border border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <ActivityIcon className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">อัตราเสี่ยงสูงต่อประชากรสูงสุด</span>
                        </div>
                        <p className="text-lg font-bold text-slate-800 truncate">{highestRiskRateFaculty?.facultyName}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{highestRiskRateFaculty?.rate.toFixed(1)}%</p>
                    </CardContent>
                </Card>

                <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">อัตราเสี่ยงต่ำสุด</span>
                        </div>
                        <p className="text-lg font-bold text-slate-800 truncate">{lowestRiskRateFaculty?.facultyName}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{lowestRiskRateFaculty?.rate.toFixed(1)}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card className="border shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-white pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800">
                                เปรียบเทียบระหว่างคณะ
                            </CardTitle>
                            <CardDescription>
                                รายละเอียดจำนวนนิสิตและความเสี่ยงรายคณะ
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Users className="h-3.5 w-3.5" />
                            <span>{stats.length} คณะ</span>
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
                                <th className="px-6 py-3 font-semibold">คณะ</th>
                                <th className="px-6 py-3 font-semibold text-right">จำนวนนิสิต</th>
                                <th className="px-6 py-3 font-semibold text-right">กลุ่มเสี่ยงสูง (High Risk)</th>
                                <th className="px-6 py-3 font-semibold w-[30%]">อัตราส่วนความเสี่ยง (Risk % of Pop.)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedStats.map((dept, index) => {
                                const rate = dept.studentCount > 0
                                    ? (dept.highRiskCount / dept.studentCount) * 100
                                    : 0;

                                return (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{index + 1}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {dept.facultyName}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600 tabular-nums">
                                            {dept.studentCount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums">
                                            <span className="font-bold text-red-600">{dept.highRiskCount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            rate > 5 ? "bg-red-500" : rate > 2 ? "bg-amber-500" : "bg-emerald-500"
                                                        )}
                                                        style={{ width: `${Math.min(rate * 5, 100)}%` }} // Scale up for visibility
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700 w-[50px] text-right">
                                                    {rate.toFixed(2)}%
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

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
