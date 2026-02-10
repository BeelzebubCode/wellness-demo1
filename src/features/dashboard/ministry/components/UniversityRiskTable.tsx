// src/features/dashboard/ministry/components/UniversityRiskTable.tsx
"use client";

import { useState, useMemo } from "react";
import { UniversityRiskMetrics } from "../hooks/useRiskMetrics";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Props {
  universities: UniversityRiskMetrics[];
}

type SortKey = "riskScore" | "queueSize" | "avgWaitTime" | "highRiskPercentage" | "therapistUtilization";
type SortDirection = "asc" | "desc";

export function UniversityRiskTable({ universities }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedData = useMemo(() => {
    return [...universities].sort((a, b) => {
      const valueA = a[sortKey];
      const valueB = b[sortKey];
      const multiplier = sortDirection === "asc" ? 1 : -1;
      return (valueA - valueB) * multiplier;
    });
  }, [universities, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600 font-bold";
    if (score >= 50) return "text-amber-600 font-semibold";
    return "text-emerald-600";
  };

  const getRiskBg = (score: number) => {
    if (score >= 70) return "bg-red-50";
    if (score >= 50) return "bg-amber-50";
    return "bg-emerald-50";
  };

  const SortButton = ({ column, label }: { column: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
    >
      <span>{label}</span>
      {sortKey === column ? (
        sortDirection === "desc" ? (
          <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUp className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-30" />
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                อันดับ
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                มหาวิทยาลัย
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ภูมิภาค
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <SortButton column="queueSize" label="คิว" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <SortButton column="avgWaitTime" label="รอเฉลี่ย" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <SortButton column="highRiskPercentage" label="% เสี่ยงสูง" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <SortButton column="therapistUtilization" label="Capacity" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <SortButton column="riskScore" label="Risk Score" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((uni, index) => (
              <tr
                key={uni.universityId}
                className={`hover:bg-gray-50 transition-colors ${getRiskBg(uni.riskScore)}`}
              >
                <td className="px-4 py-3 text-gray-500 font-medium">
                  #{index + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                      {uni.universityCode.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {uni.universityName}
                      </div>
                      <div className="text-xs text-gray-500">{uni.province}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-xs font-medium">
                    {uni.regionName}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold ${uni.queueSize > 50 ? "text-red-600" : uni.queueSize > 35 ? "text-amber-600" : "text-gray-700"}`}>
                    {uni.queueSize}
                  </span>
                  <div className="text-xs text-gray-500">เคส</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold ${uni.avgWaitTime > 7 ? "text-red-600" : uni.avgWaitTime > 3 ? "text-amber-600" : "text-gray-700"}`}>
                    {uni.avgWaitTime.toFixed(1)}
                  </span>
                  <div className="text-xs text-gray-500">วัน</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold ${uni.highRiskPercentage > 20 ? "text-red-600" : uni.highRiskPercentage > 10 ? "text-amber-600" : "text-gray-700"}`}>
                    {uni.highRiskPercentage.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold ${uni.therapistUtilization > 90 ? "text-red-600" : uni.therapistUtilization > 80 ? "text-amber-600" : "text-gray-700"}`}>
                    {uni.therapistUtilization.toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-8 rounded-lg ${getRiskColor(uni.riskScore)} ${getRiskBg(uni.riskScore)} font-black`}>
                    {uni.riskScore.toFixed(1)}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Link
                    href={`/ministry/universities/${uni.universityCode}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    ดู
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {universities.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          ไม่พบข้อมูล
        </div>
      )}
    </div>
  );
}
