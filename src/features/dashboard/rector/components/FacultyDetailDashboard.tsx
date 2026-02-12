// src/features/dashboard/dean/components/FacultyDetailDashboard.tsx
"use client";

import { useRectorFacultyStats } from "../hooks/useRectorFacultyStats";
import { Users, BookOpen, AlertTriangle, GraduationCap, TrendingUp, ArrowLeft, Building2, Activity } from "lucide-react";
import { FacultyDateRangePicker } from "@/features/dashboard/dean/faculty-dashboard/shared/components/FacultyDateRangePicker";
import { useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
    facultyCode: string;
    showTable?: boolean;
}

export function FacultyDetailDashboard({ facultyCode, showTable = true }: Props) {
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
        from: new Date(2026, 0, 13), // 13/01/2569
        to: new Date(2026, 1, 12),   // 12/02/2569
    });
    const { stats, isLoading, error } = useRectorFacultyStats(facultyCode, dateRange as { from: Date; to: Date } | undefined);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-gray-600 font-semibold">Loading faculty statistics...</div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 font-semibold mb-2">Error loading faculty data</div>
                    <div className="text-gray-600">{error || "Unknown error"}</div>
                </div>
            </div>
        );
    }

    // Prepare data for risk distribution chart
    const riskData = [
        { name: "Critical", value: stats.riskDistribution.critical, color: "#dc2626" },
        { name: "High", value: stats.riskDistribution.high, color: "#f97316" },
        { name: "Moderate", value: stats.riskDistribution.moderate, color: "#fbbf24" },
        { name: "Normal", value: stats.riskDistribution.normal, color: "#22c55e" },
    ];

    // Prepare data for problem breakdown chart
    const problemData = Object.entries(stats.problemBreakdown)
        .map(([code, count]) => ({
            name: code,
            count: count as number,
        }))
        .sort((a, b) => (b.count as number) - (a.count as number))
        .slice(0, 10); // Top 10 problems

    const totalRisk = stats.riskDistribution.critical + stats.riskDistribution.high;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div />
                <div className="flex flex-col items-end gap-2">
                    <FacultyDateRangePicker 
                        startDate={dateRange.from}
                        endDate={dateRange.to}
                        onChange={(range: { from?: Date; to?: Date }) => setDateRange({ from: range.from, to: range.to })}
                    />
                    <p className="text-[10px] text-slate-400 font-black uppercase text-right">
                        อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Total Students */}
                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 p-6 border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 flex flex-col justify-between border-l-8 border-primary">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-primary/5 w-10 h-10 rounded-xl flex items-center justify-center ring-4 ring-white shadow-sm transition-transform group-hover:rotate-6">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Students</p>
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalStudents.toLocaleString()}</h3>
                    <div className="mt-4 pt-4 border-t border-slate-50/80">
                         <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">ข้อมูลจากทะเบียนนิสิต</span>
                    </div>
                </div>

                {/* Total Departments */}
                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 p-6 border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 flex flex-col justify-between border-l-8 border-primary">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-primary/5 w-10 h-10 rounded-xl flex items-center justify-center ring-4 ring-white shadow-sm transition-transform group-hover:rotate-6">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Departments</p>
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalDepartments}</h3>
                    <div className="mt-4 pt-4 border-t border-slate-50/80">
                         <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">ภาควิชาทั้งหมดในคณะ</span>
                    </div>
                </div>

                {/* Total Bookings */}
                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 p-6 border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 flex flex-col justify-between border-l-8 border-primary">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-primary/5 w-10 h-10 rounded-xl flex items-center justify-center ring-4 ring-white shadow-sm transition-transform group-hover:rotate-6">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Case</p>
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalBookings.toLocaleString()}</h3>
                    <div className="mt-4 pt-4 border-t border-slate-50/80">
                         <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">จํานวนการเข้ารับบริการทั้งหมด</span>
                    </div>
                </div>

                {/* High Risk Cases */}
                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 p-6 border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 flex flex-col justify-between border-l-8 border-primary">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-primary/5 w-10 h-10 rounded-xl flex items-center justify-center ring-4 ring-white shadow-sm transition-transform group-hover:rotate-6">
                            <AlertTriangle className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">High Risk Cases</p>
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">{totalRisk.toLocaleString()}</h3>
                    <div className="mt-4 pt-4 border-t border-slate-50/80">
                         <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">จํานวนเคสที่ต้องติดตามใกล้ชิด</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Risk Distribution Chart */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Risk Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={riskData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {riskData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Problem Categories Chart */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Top Problem Categories</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={problemData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Department Statistics Table */}
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Department Statistics</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department Code</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department Name</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Students</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Case</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Case per Students</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.departmentStats.map((dept: any) => {
                                const sessionsPerStudent = dept.studentCount > 0
                                    ? (dept.bookingCount / dept.studentCount).toFixed(2)
                                    : "0.00";

                                return (
                                    <tr key={dept.departmentId} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept.departmentCode}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{dept.departmentName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{dept.studentCount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{dept.bookingCount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{sessionsPerStudent}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
