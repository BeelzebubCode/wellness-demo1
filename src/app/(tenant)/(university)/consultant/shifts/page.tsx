// src/app/(tenant)/(university)/consultant/shifts/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import {
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building2,
} from "lucide-react";

type ShiftStatus = "ACTIVE" | "ON_LOAN" | "COMPLETED" | "CANCELLED" | "PAUSED";
type BorrowPeriodStatus = "ACTIVE" | "RETURNED" | "CANCELLED";

type BorrowPeriod = {
  periodId: number;
  borrowedToUniversity: {
    nameTh: string;
    nameEn: string | null;
    shortNameTh: string | null;
  };
  startDate: string; // YYYY-MM-DD
  endDate: string;
  actualReturnDate: string | null;
  status: BorrowPeriodStatus;
};

type Shift = {
  shiftId: number;
  startDate: string;
  endDate: string;
  daysWorked: number;
  daysRemaining: number;
  status: ShiftStatus;
  homeUniversity: {
    nameTh: string;
    nameEn: string | null;
  };
  borrowPeriods: BorrowPeriod[];
  createdAt: string;
  completedAt: string | null;
};

type ShiftScheduleData = {
  currentShift: Shift | null;
  upcomingShifts: Shift[];
  completedShifts: Shift[];
};

function StatusBadge({ status }: { status: ShiftStatus }) {
  const config = {
    ACTIVE: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "ปกติ",
      icon: CheckCircle2,
    },
    ON_LOAN: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      label: "ถูกยืมตัว",
      icon: ArrowRight,
    },
    COMPLETED: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: "เสร็จสิ้น",
      icon: CheckCircle2,
    },
    CANCELLED: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "ยกเลิก",
      icon: AlertCircle,
    },
    PAUSED: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "พัก",
      icon: Clock,
    },
  };

  const { bg, text, label, icon: Icon } = config[status] || config.ACTIVE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function ShiftTimeline({ shift }: { shift: Shift }) {
  const startDate = new Date(shift.startDate);
  const endDate = new Date(shift.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 14 days
  const days = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }

  // Check if a day is borrowed
  const isBorrowed = (date: Date) => {
    return shift.borrowPeriods.some((bp) => {
      const bStart = new Date(bp.startDate);
      const bEnd = new Date(bp.endDate);
      return date >= bStart && date <= bEnd && bp.status === "ACTIVE";
    });
  };

  const isReturned = (date: Date) => {
    return shift.borrowPeriods.some((bp) => {
      const bStart = new Date(bp.startDate);
      const bEnd = new Date(bp.endDate);
      return date >= bStart && date <= bEnd && bp.status === "RETURNED";
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">
          ไทม์ไลน์ 14 วัน
        </h4>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-slate-600">ทำแล้ว</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-slate-600">กำลังถูกยืม</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-slate-600">ยืมแล้วคืน</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-slate-300" />
            <span className="text-slate-600">ยังไม่ถึง</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const isPast = day < today;
          const isToday = day.toDateString() === today.toDateString();
          const borrowed = isBorrowed(day);
          const returned = isReturned(day);

          let bgColor = "border-2 border-slate-300 bg-white";
          if (isPast && !borrowed && !returned) {
            bgColor = "bg-green-500 text-white";
          } else if (borrowed) {
            bgColor = "bg-blue-500 text-white";
          } else if (returned) {
            bgColor = "bg-purple-500 text-white";
          }

          return (
            <div
              key={idx}
              className={`relative rounded-lg p-2 text-center ${bgColor} ${
                isToday ? "ring-2 ring-primary-500 ring-offset-2" : ""
              }`}
            >
              <div className="text-xs font-semibold">
                วัน {idx + 1}
              </div>
              <div className="text-[10px] opacity-80">
                {day.getDate()}/{day.getMonth() + 1}
              </div>
              {isToday && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-600 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CurrentShiftCard({ shift }: { shift: Shift }) {
  const activeBorrow = shift.borrowPeriods.find((bp) => bp.status === "ACTIVE");

  return (
    <Card className="rounded-2xl p-6 shadow-sm border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            เวรปัจจุบัน
          </h3>
          <p className="text-sm text-slate-600">
            {new Date(shift.startDate).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "long",
            })}{" "}
            -{" "}
            {new Date(shift.endDate).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <StatusBadge status={shift.status} />
      </div>

      {/* Progress */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">ทำไปแล้ว</div>
          <div className="text-2xl font-bold text-green-600">
            {shift.daysWorked} วัน
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">เหลืออีก</div>
          <div className="text-2xl font-bold text-primary-600">
            {shift.daysRemaining} วัน
          </div>
        </div>
      </div>

      {/* Active Borrow */}
      {activeBorrow && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-blue-900 mb-1">
                🔄 กำลังถูกยืมตัว
              </div>
              <div className="text-sm text-blue-700">
                {activeBorrow.borrowedToUniversity.shortNameTh ||
                  activeBorrow.borrowedToUniversity.nameTh}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {new Date(activeBorrow.startDate).toLocaleDateString("th-TH")}{" "}
                - {new Date(activeBorrow.endDate).toLocaleDateString("th-TH")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <ShiftTimeline shift={shift} />
    </Card>
  );
}

export default function ConsultantShiftsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ShiftScheduleData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShifts() {
      try {
        setLoading(true);
        const res = await fetch("/api/v2/consultant/shifts/my-schedule");
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to fetch shifts");
        }

        setData(json.data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchShifts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-slate-600">กำลังโหลดตารางเวร...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            เกิดข้อผิดพลาด
          </h3>
          <p className="text-sm text-slate-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              ตารางเวรของฉัน
            </h1>
            <p className="text-sm text-slate-600">
              ดูและจัดการเวรให้คำปรึกษา (14 วัน/รอบ)
            </p>
          </div>
        </div>

        {/* Current Shift */}
        {data.currentShift ? (
          <CurrentShiftCard shift={data.currentShift} />
        ) : (
          <Card className="rounded-2xl p-12 text-center shadow-sm">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              ยังไม่มีเวรปัจจุบัน
            </h3>
            <p className="text-sm text-slate-500">
              คุณยังไม่ได้อยู่ในช่วงเวรให้คำปรึกษา
            </p>
          </Card>
        )}

        {/* Upcoming Shifts */}
        {data.upcomingShifts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              เวรที่กำลังจะมาถึง
            </h2>
            <div className="grid gap-4">
              {data.upcomingShifts.map((shift) => (
                <Card
                  key={shift.shiftId}
                  className="rounded-2xl p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 mb-1">
                        เวรรอบถัดไป
                      </div>
                      <div className="text-sm text-slate-600">
                        {new Date(shift.startDate).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "long",
                        })}{" "}
                        -{" "}
                        {new Date(shift.endDate).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <StatusBadge status={shift.status} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Shifts */}
        {data.completedShifts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              ประวัติเวร
            </h2>
            <div className="grid gap-3">
              {data.completedShifts.slice(0, 5).map((shift) => (
                <Card
                  key={shift.shiftId}
                  className="rounded-xl p-4 shadow-sm bg-slate-50"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-slate-600">
                      {new Date(shift.startDate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      -{" "}
                      {new Date(shift.endDate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <StatusBadge status={shift.status} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
