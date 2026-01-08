'use client';

import { Card, Button, LoadingSpinner } from '@/components/ui';
import type { Booking } from '@/types';
import { Clock3, User2, ArrowRightLeft, UserCheck } from 'lucide-react';

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? 'PENDING_ASSIGNMENT').toUpperCase();

  const map: Record<string, { label: string; cls: string; dot: string }> = {
    PENDING_ASSIGNMENT: {
      label: 'รอการยืนยัน',
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-600',
    },
    ASSIGNED: {
      label: 'มอบหมายแล้ว',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-600',
    },
    IN_PROGRESS: {
      label: 'กำลังให้คำปรึกษา',
      cls: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-600',
    },
    COMPLETED: {
      label: 'เสร็จสิ้น',
      cls: 'bg-gray-100 text-gray-700 border-gray-200',
      dot: 'bg-gray-500',
    },
    CANCELLED: {
      label: 'ยกเลิก',
      cls: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-600',
    },
  };

  const cfg = map[s] ?? map.PENDING_ASSIGNMENT;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium text-[11px] md:text-xs ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function BookingsListCard({
  isLoading,
  bookings,
  onOpenProblem,
  onOpenReschedule,
  onOpenAssign,
}: {
  isLoading: boolean;
  bookings: Booking[];
  onOpenProblem: (b: Booking) => void;
  onOpenReschedule: (b: Booking) => void;
  onOpenAssign: (b: Booking) => void;
}) {
  return (
    <Card className="rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 bg-white">
      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <LoadingSpinner size="lg" label="กำลังโหลดข้อมูลคิว..." />
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-semibold text-gray-800">ยังไม่มีคิวในวันที่เลือก</p>
          <p className="text-xs text-gray-500 mt-1">ลองเลือกวันอื่น หรือกดรีเฟรชอีกครั้ง</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[1.3fr,0.9fr,1.1fr,0.9fr,1.2fr] text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 mb-2 shadow-sm">
            <span className="pl-1">ผู้จอง / ช่องทาง</span>
            <span>เวลา</span>
            <span>ประเภทปัญหา</span>
            <span>สถานะ</span>
            <span className="text-right pr-1">การจัดการ</span>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="grid gap-2 md:grid-cols-[1.3fr,0.9fr,1.1fr,0.9fr,1.2fr] items-center rounded-xl border border-gray-100 px-3 py-3 md:px-4 md:py-3 text-xs md:text-sm bg-slate-50/70 md:bg-white hover:shadow-sm transition-shadow"
              >
                {/* User */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-50">
                    <User2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="leading-tight min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {booking.userName ?? 'ไม่ทราบชื่อ'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      LINE ID: {booking.lineUserId ?? '-'}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1.5 text-gray-800 whitespace-nowrap">
                  <Clock3 className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-medium">
                    {booking.startTime}–{booking.endTime} น.
                  </span>
                </div>

                {/* Problem */}
                <button
                  type="button"
                  onClick={() => onOpenProblem(booking)}
                  className="text-left group min-w-0"
                  title="กดเพื่อดูรายละเอียด"
                >
                  <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                    {booking.problemType ?? '-'}
                  </p>
                  {booking.problemDescription ? (
                    <p className="text-xs text-gray-500 line-clamp-1 group-hover:text-gray-600">
                      {booking.problemDescription}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">ไม่มีรายละเอียดเพิ่มเติม</p>
                  )}
                  <span className="mt-1 inline-flex items-center text-[11px] text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    กดเพื่อดูรายละเอียด
                  </span>
                </button>

                {/* Status */}
                <div>
                  <StatusBadge status={(booking as any).status ?? null} />
                </div>

                {/* Actions */}
                <div className="flex md:justify-end gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 whitespace-nowrap"
                    onClick={() => onOpenReschedule(booking)}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>เลื่อนเวลา</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 whitespace-nowrap"
                    onClick={() => onOpenAssign(booking)}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>แจกงาน</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
