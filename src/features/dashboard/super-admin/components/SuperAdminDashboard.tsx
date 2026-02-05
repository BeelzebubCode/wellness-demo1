// features/dashboard/super-admin/components/SuperAdminDashboard.tsx
"use client";

import { useSuperAdminDashboard } from "../hooks/useSuperAdminDashboard";
import { SuperAdminStats } from "./SuperAdminStats";
import { LoadingSpinner, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export function SuperAdminDashboard() {
  const { stats, isLoading } = useSuperAdminDashboard();

  if (isLoading || !stats) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Control Panel</h1>
        <p className="text-gray-500">จัดการระบบส่วนกลาง</p>
      </div>

      <SuperAdminStats stats={stats} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent system alerts.</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tenant Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Usage statistics chart placeholder.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
