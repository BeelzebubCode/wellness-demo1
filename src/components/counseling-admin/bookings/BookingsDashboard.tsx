"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { AdminBookingRow } from "@/features/counseling-admin/type";
import { Clock3, UserCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: number;
  tone: "amber" | "emerald" | "sky" | "slate";
}) {
  const toneCls =
    tone === "amber"
      ? "bg-amber-50 border-amber-100 text-amber-900"
      : tone === "emerald"
      ? "bg-emerald-50 border-emerald-100 text-emerald-900"
      : tone === "sky"
      ? "bg-sky-50 border-sky-100 text-sky-900"
      : "bg-slate-50 border-slate-100 text-slate-900";

  return (
    <Card className={cn("p-4 rounded-2xl border", toneCls)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold opacity-80">{label}</div>
          <div className="text-2xl font-extrabold leading-tight">{value}</div>
        </div>
      </div>
    </Card>
  );
}

export function BookingsDashboard({ bookings }: { bookings: AdminBookingRow[] }) {
  const stat = useMemo(() => {
    const all = bookings.length;
    const pending = bookings.filter((b) => b.status === "PENDING_ASSIGNMENT").length;
    const assigned = bookings.filter((b) => b.status === "ASSIGNED").length;
    const done = bookings.filter((b) => b.status === "COMPLETED").length;
    return { all, pending, assigned, done };
  }, [bookings]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard icon={Clock3} label="ทั้งหมด" value={stat.all} tone="slate" />
      <StatCard icon={AlertTriangle} label="รอมอบหมาย" value={stat.pending} tone="amber" />
      <StatCard icon={UserCheck} label="มอบหมายแล้ว" value={stat.assigned} tone="sky" />
      <StatCard icon={CheckCircle2} label="เสร็จสิ้น" value={stat.done} tone="emerald" />
    </div>
  );
}
