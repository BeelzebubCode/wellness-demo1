// features/dashboard/ministry/components/MinistryStatsCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Building2, Users, Activity, AlertTriangle } from "lucide-react";
import { MinistryStats } from "../hooks/useMinistryStats";

interface Props {
  stats: MinistryStats;
}

export function MinistryStatsCards({ stats }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-blue-800">มหาวิทยาลัยในระบบ</CardTitle>
          <Building2 className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{stats.totalUniversities}</div>
          <p className="text-xs text-blue-700">แห่ง</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-indigo-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-indigo-800">นิสิตทั้งหมด</CardTitle>
          <Users className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-900">{stats.totalStudents.toLocaleString()}</div>
          <p className="text-xs text-indigo-700">คน</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-yellow-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-yellow-800">การจองทั้งหมด</CardTitle>
          <Activity className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-900">{stats.totalBookings.toLocaleString()}</div>
          <p className="text-xs text-yellow-700">ครั้ง</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-red-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-red-800">เคสความเสี่ยงสูง</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900">{stats.highRiskCases.toLocaleString()}</div>
          <p className="text-xs text-red-700">ราย (สะสม)</p>
        </CardContent>
      </Card>
    </div>
  );
}
