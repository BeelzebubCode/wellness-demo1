"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StudentListItem {
    facultyName: string;
    studentCount: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
}

interface Props {
    data: StudentListItem[];
}

export function RectorStudentList({ data }: Props) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase">
                    <tr>
                        <th className="px-4 py-3">คณะ</th>
                        <th className="px-4 py-3 text-center">นิสิตทั้งหมด</th>
                        <th className="px-4 py-3 text-center">🔴 สูง</th>
                        <th className="px-4 py-3 text-center">🟠 กลาง</th>
                        <th className="px-4 py-3 text-center">🟢 ต่ำ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                ไม่พบข้อมูลคณะ
                            </td>
                        </tr>
                    ) : (
                        data.map((faculty, idx) => (
                            <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900">{faculty.facultyName}</td>
                                <td className="px-4 py-3 text-center font-semibold text-blue-600">
                                    {faculty.studentCount}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-semibold text-xs">
                                        {faculty.highRiskCount}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-semibold text-xs">
                                        {faculty.mediumRiskCount}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold text-xs">
                                        {faculty.lowRiskCount}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
