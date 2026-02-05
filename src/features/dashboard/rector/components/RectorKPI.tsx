// features/dashboard/rector/components/RectorKPI.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Users, TrendingUp, AlertTriangle, Activity } from "lucide-react";
import { RectorStatsData } from "../hooks/useRectorStats";

interface Props {
  data: RectorStatsData['kpi'];
}

export function RectorKPI({ data }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">ผู้ใช้งานทั้งหมด</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{data.totalUsers.toLocaleString()}</div>
          <p className="text-xs text-blue-600">+12% จากเดือนที่แล้ว</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-green-700">เคสที่ปิดแล้ว</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">{data.closedCases}%</div>
          <p className="text-xs text-green-600">อัตราความสำเร็จ</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-red-700">กลุ่มเสี่ยงสูง</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900">{data.highRisk}</div>
          <p className="text-xs text-red-600">ต้องติดตามใกล้ชิด</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">ความพึงพอใจ</CardTitle>
          <Activity className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">{data.satisfaction}/5</div>
          <p className="text-xs text-purple-600">จาก 500+ รีวิว</p>
        </CardContent>
      </Card>
    </div>
  );
}
