
"use client";

import React, { useEffect, useState } from "react";
import { Loader2, GraduationCap, AlertTriangle, CheckCircle } from "lucide-react";

interface FacultyStats {
  facultyName: string;
  totalStudents: number;
  riskDistribution: {
    critical: number;
    high: number;
    moderate: number;
    normal: number;
  };
  departmentStats: Array<{
    departmentCode: string;
    departmentName: string;
    studentCount: number;
    criticalRiskDetails: number;
  }>;
}

export default function DeanDashboardPage() {
  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v2/dean/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!stats) {
    return <div className="p-6">Unable to load dashboard data.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{stats.facultyName}</h1>
        <p className="text-slate-500">Overview of student wellness in your faculty.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Students</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Critical Risk</p>
              <p className="text-xl font-bold text-red-600">{stats.riskDistribution.critical}</p>
              <p className="text-xs text-slate-400">Students requiring immediate attention</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Normal Status</p>
              <p className="text-2xl font-bold text-slate-900">{stats.riskDistribution.normal}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Department Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Total Students</th>
                <th className="px-6 py-3 text-right">Critical Cases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.departmentStats.map((dept) => (
                <tr key={dept.departmentCode} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {dept.departmentName}
                    <span className="ml-2 text-xs text-slate-400 font-normal">({dept.departmentCode})</span>
                  </td>
                  <td className="px-6 py-3">{dept.studentCount}</td>
                  <td className="px-6 py-3 text-right">
                    {dept.criticalRiskDetails > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {dept.criticalRiskDetails}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
