// src/features/booking/components/my-appointments/BookingSummaryPanel.tsx
"use client";

import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { History } from "lucide-react";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export function BookingSummaryPanel({
  activeCount,
  completedCount,
  cancelledCount,
  totalCount,
}: {
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  totalCount: number;
}) {
  const data = {
    labels: ["กำลังดำเนินการ", "สำเร็จ", "ยกเลิก"],
    datasets: [
      {
        data: [activeCount, completedCount, cancelledCount],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10 } },
      tooltip: { enabled: true },
    },
  };

  return (
    <Card className="rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-gray-800">สรุปการใช้งาน</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            รวมทั้งหมด <span className="font-semibold text-gray-800">{totalCount}</span> รายการ
          </p>
        </div>

        <Link href="/booking/history">
          <Button variant="outline" size="sm" className="shrink-0">
            ดูประวัติ
          </Button>
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* chart */}
        <div className="relative h-[220px] md:col-span-1">
          <Doughnut data={data} options={options} />
          {/* center label */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[11px] text-gray-500">ทั้งหมด</div>
              <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
            </div>
          </div>
        </div>

        {/* stats */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-gray-500">กำลังดำเนินการ</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{activeCount}</div>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-gray-500">สำเร็จ</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{completedCount}</div>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-gray-500">ยกเลิก</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{cancelledCount}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
