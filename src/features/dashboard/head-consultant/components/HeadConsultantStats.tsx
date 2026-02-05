// features/dashboard/head-consultant/components/HeadConsultantStats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Clock, Activity, CheckCircle, AlertTriangle } from "lucide-react";
import { DashboardStats } from "../hooks/useHeadConsultantDashboard";

interface Props {
  stats: DashboardStats;
}

export function HeadConsultantStats({ stats }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">เคสที่รอจัดสรร</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.pendingCases}</div>
          <p className="text-xs text-orange-600">ต้องดำเนินการด่วน</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">กำลังดำเนินการ</CardTitle>
          <Activity className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.activeCases}</div>
          <p className="text-xs text-blue-600">โดยทีมของคุณ</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">ปิดเคสเดือนนี้</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.closedCases}</div>
          <p className="text-xs text-green-600">+5% จากเดือนที่แล้ว</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">ความเสี่ยงสูง</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.highRiskCases}</div>
          <p className="text-xs text-red-600">ที่ต้องติดตามพิเศษ</p>
        </CardContent>
      </Card>
    </div>
  );
}
