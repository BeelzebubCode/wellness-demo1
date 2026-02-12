// features/dashboard/head-consultant/components/TeamStatusCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { Users, Briefcase } from "lucide-react";
import type { TeamMember } from "../hooks/useHeadConsultantDashboard";

interface Props {
  team: TeamMember[];
}

export function TeamStatusCard({ team }: Props) {
  const sorted = [...team].sort((a, b) => b.activeBookings - a.activeBookings);

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-base">ทีมผู้ให้คำปรึกษา</CardTitle>
          <CardDescription>
            {team.length} คน • เคสที่กำลังดูแล
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((m) => (
              <div
                key={m.consultantId}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50/80 transition-colors"
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {m.firstName.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {m.prefix}{m.firstName} {m.lastName}
                  </p>
                  {m.specializations.length > 0 && (
                    <p className="text-xs text-gray-400 truncate">
                      {m.specializations.slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>

                {/* Active bookings badge */}
                <div className="flex items-center gap-1 shrink-0">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                  <span
                    className={`text-sm font-semibold tabular-nums ${m.activeBookings > 0 ? "text-blue-600" : "text-gray-400"
                      }`}
                  >
                    {m.activeBookings}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
