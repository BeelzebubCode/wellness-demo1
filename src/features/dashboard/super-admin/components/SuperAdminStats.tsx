// features/dashboard/super-admin/components/SuperAdminStats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Building2, BookOpen, Handshake, ShieldCheck } from "lucide-react";
import { SystemStats } from "../hooks/useSuperAdminDashboard";

interface Props {
  stats: SystemStats;
}

export function SuperAdminStats({ stats }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white border-blue-100 shadow-sm hover:shadow-md transition cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Tenants (Universities)</CardTitle>
          <Building2 className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.tenantCount}</div>
          <p className="text-xs text-blue-600">Active</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-green-100 shadow-sm hover:shadow-md transition cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Knowledge Base</CardTitle>
          <BookOpen className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.kbDocuments.toLocaleString()}</div>
          <p className="text-xs text-green-600">Documents</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-purple-100 shadow-sm hover:shadow-md transition cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Borrow Requests</CardTitle>
          <Handshake className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.pendingBorrowRequests}</div>
          <p className="text-xs text-purple-600">Pending</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-red-100 shadow-sm hover:shadow-md transition cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">System Status</CardTitle>
          <ShieldCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.systemHealth}</div>
          <p className="text-xs text-gray-500">Uptime {stats.uptime}</p>
        </CardContent>
      </Card>
    </div>
  );
}
