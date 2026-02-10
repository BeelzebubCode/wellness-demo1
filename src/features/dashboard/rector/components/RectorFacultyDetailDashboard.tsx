// src/features/dashboard/rector/components/RectorFacultyDetailDashboard.tsx
"use client";

import { useRectorFacultyStats } from "../hooks/useRectorFacultyStats";
import { Users, BookOpen, AlertTriangle, GraduationCap, TrendingUp, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
    facultyCode: string;
}

export function RectorFacultyDetailDashboard({ facultyCode }: Props) {
    const { stats, isLoading, error } = useRectorFacultyStats(facultyCode);

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
            count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const totalRisk = stats.riskDistribution.critical + stats.riskDistribution.high;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <Link
                    href="/rector/faculties"
                    className="inline-flex items-center gap-2 text-[rgb(var(--primary))] hover:text-[rgb(var(--primary-600))] mb-4 font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Faculties
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{stats.facultyName}</h1>
                <p className="text-gray-600">{stats.universityName}</p>
                {stats.educationFieldGroup && (
                    <span className="inline-block mt-2 text-sm font-semibold text-[rgb(var(--primary))] uppercase tracking-wide bg-[rgba(var(--primary),0.1)] px-3 py-1 rounded-lg">
                        {stats.educationFieldGroup}
                    </span>
                )}
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Students */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</h3>
                    <p className="text-gray-600 text-sm">Total Students</p>
                </div>

                {/* Total Departments */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <GraduationCap className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalDepartments}</h3>
                    <p className="text-gray-600 text-sm">Departments</p>
                </div>

                {/* Total Bookings */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <BookOpen className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalBookings.toLocaleString()}</h3>
                    <p className="text-gray-600 text-sm">Total Counseling Sessions</p>
                </div>

                {/* High Risk Cases */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-3 bg-red-100 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{totalRisk.toLocaleString()}</h3>
                    <p className="text-gray-600 text-sm">High Risk Cases</p>
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
                                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                            <Bar dataKey="count" fill="rgb(var(--primary))" />
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
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Counseling Sessions</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Sessions per Student</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.departmentStats.map((dept) => {
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
