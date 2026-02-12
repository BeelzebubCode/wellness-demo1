// features/dashboard/head-consultant/components/HeadConsultantStats.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Clock, Users, CheckCircle, XCircle, Activity, CalendarRange } from "lucide-react";
import type { BookingStats } from "../hooks/useHeadConsultantDashboard";

interface Props {
  stats: BookingStats;
}

const STAT_CARDS = [
  {
    key: "pending" as const,
    label: "รอจัดสรร",
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-50",
    sub: "ต้องดำเนินการ",
    subColor: "text-orange-600",
  },
  {
    key: "inProgress" as const,
    label: "กำลังดำเนินการ",
    icon: Activity,
    color: "text-blue-500",
    bg: "bg-blue-50",
    sub: "กำลังให้คำปรึกษา",
    subColor: "text-blue-600",
  },
  {
    key: "completed" as const,
    label: "ปิดเคสแล้ว",
    icon: CheckCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    sub: "เสร็จสิ้น",
    subColor: "text-emerald-600",
  },
  {
    key: "cancelled" as const,
    label: "ยกเลิก",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-50",
    sub: "ถูกยกเลิก",
    subColor: "text-red-500",
  },
  {
    key: "assigned" as const,
    label: "มอบหมายแล้ว",
    icon: Users,
    color: "text-violet-500",
    bg: "bg-violet-50",
    sub: "รอเริ่มนัด",
    subColor: "text-violet-600",
  },
  {
    key: "totalThisMonth" as const,
    label: "เคสเดือนนี้",
    icon: CalendarRange,
    color: "text-sky-500",
    bg: "bg-sky-50",
    sub: "ทั้งหมด",
    subColor: "text-sky-600",
  },
] as const;

export function HeadConsultantStats({ stats }: Props) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {STAT_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key} className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-500 leading-snug">
                {card.label}
              </CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-gray-900 tabular-nums">
                {stats[card.key].toLocaleString()}
              </div>
              <p className={`text-[11px] mt-0.5 ${card.subColor}`}>{card.sub}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
