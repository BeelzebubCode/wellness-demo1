// features/dashboard/advisor/components/AdvisorStatsCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Users, Calendar, AlertCircle } from "lucide-react";
import { AdvisorStats } from "../hooks/useAdvisorStats";

interface Props {
  stats: AdvisorStats;
}

export function AdvisorStatsCards({ stats }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">นิสิตในความดูแล</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalStudents}</div>
          <p className="text-xs text-muted-foreground">คน</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">เคสที่กำลังดูแล</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeCases}</div>
          <p className="text-xs text-muted-foreground">รายการ</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ความเสี่ยงสูง (30 วันล่าสุด)</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.highRiskRecent}</div>
          <p className="text-xs text-muted-foreground">เคสที่ต้องจับตาดู</p>
        </CardContent>
      </Card>
    </div>
  );
}
