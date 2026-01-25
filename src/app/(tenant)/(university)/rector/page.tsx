"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function RectorPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Rector Dashboard</h1>
            <p className="text-sm text-slate-600">ภาพรวมการให้บริการและสถานะระบบของมหาวิทยาลัย</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge>RECTOR</Badge>
            <Button asChild variant="outline">
              <Link href="/counseling-admin/data-center">ไปหน้า Data Center</Link>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-slate-500">Bookings (เดือนนี้)</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
            <p className="mt-1 text-xs text-slate-500">รอ hook/API ต่อ</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Completed</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
            <p className="mt-1 text-xs text-slate-500">รอ hook/API ต่อ</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">No-show / Cancel</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
            <p className="mt-1 text-xs text-slate-500">รอ hook/API ต่อ</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Avg. Wait Time</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
            <p className="mt-1 text-xs text-slate-500">รอ hook/API ต่อ</p>
          </Card>
        </div>

        {/* Sections */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">แนวโน้มการใช้งาน</h2>
              <Button variant="outline" size="sm">Export</Button>
            </div>
            <div className="mt-4 h-56 rounded-xl border border-dashed border-slate-200 bg-white" />
            <p className="mt-2 text-xs text-slate-500">
              ตรงนี้เดี๋ยวต่อ chart/summary จาก API ได้
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
            <div className="mt-3 grid gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/stats">ดูสถิติระบบ (เดิม)</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/bookings">ดูรายการจองทั้งหมด</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/schedule">ดูตารางเวลา</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
