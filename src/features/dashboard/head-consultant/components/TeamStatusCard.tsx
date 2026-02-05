// features/dashboard/head-consultant/components/TeamStatusCard.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { TeamMember } from "../hooks/useHeadConsultantDashboard";

interface Props {
  team: TeamMember[];
}

export function TeamStatusCard({ team }: Props) {
  const activeCount = team.filter((m) => m.status === "active").length;
  const busyCount = team.filter((m) => m.status === "busy").length;
  const offlineCount = team.filter((m) => m.status === "offline").length;

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>ทีมผู้ให้คำปรึกษา</CardTitle>
        <CardDescription>สถานะความพร้อมของทีมวันนี้</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <StatusRow label="พร้อมให้บริการ" count={activeCount} colorClass="bg-green-500" />
          <StatusRow label="ติดภารกิจ" count={busyCount} colorClass="bg-yellow-500" />
          <StatusRow label="ออกเวรแล้ว" count={offlineCount} colorClass="bg-gray-300" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({
  label,
  count,
  colorClass,
}: {
  label: string;
  count: number;
  colorClass: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${colorClass}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm text-gray-500">{count} คน</span>
    </div>
  );
}
