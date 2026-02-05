// ==========================================
// 📌 Admin Page: My Jobs / งานของฉัน
// path: /admin/my-jobs
// ==========================================

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Button, LoadingSpinner } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatThaiDate, toISODateString } from '@/lib/date';
import type { Booking } from '@/types';

import {
  ClipboardList,
  CalendarClock,
  CheckCircle2,
  Clock3,
  User2,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Filter,
} from 'lucide-react';

type StatusFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface MyJobsResponse {
  jobs: Booking[];
  todayCount: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
}

export default function AdminMyJobsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [data, setData] = useState<MyJobsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const selectedDateStr = useMemo(
    () => toISODateString(selectedDate),
    [selectedDate],
  );

  // โหลดงานของแอดมิน
  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('date', selectedDateStr);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/my-jobs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch my jobs');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateStr, statusFilter]);

  // รับเคสเข้ามาทำเอง
  const handleTakeJob = async (bookingId: string) => {
    setIsMutating(true);
    try {
      const res = await fetch(`/api/admin/my-jobs/${bookingId}/take`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to take job');
      await fetchJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsMutating(false);
    }
  };

  // เปลี่ยนสถานะเป็นกำลังดำเนินการ / เสร็จสิ้น / ยกเลิก
  const handleChangeStatus = async (bookingId: string, nextStatus: string) => {
    setIsMutating(true);
    try {
      const res = await fetch(`/api/admin/my-jobs/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsMutating(false);
    }
  };

  const jobs = data?.jobs ?? [];

  const handleChangeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    const [y, m, d] = value.split('-').map((v) => parseInt(v, 10));
    setSelectedDate(new Date(y, m - 1, d));
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary-50 text-primary-600">
              <ClipboardList className="w-6 h-6" />
            </span>
            งานของฉัน
          </h1>
          <p className="text-sm text-gray-500 mt-1 md:ml-10">
            ดูคิวที่รับผิดชอบ และจัดการสถานะการให้คำปรึกษา
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* เลือกวันที่ */}
          <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-3 py-1.5">
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              className="text-sm border-none outline-none bg-transparent text-gray-800"
              value={selectedDateStr}
              onChange={handleChangeDate}
            />
          </div>

          {/* Filter สถานะ */}
          <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-3 py-1.5">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="text-sm border-none outline-none bg-transparent text-gray-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="IN_PROGRESS">กำลังดำเนินการ</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'นัดหมายวันนี้',
            value: data?.todayCount ?? 0,
            icon: CalendarClock,
            color: 'text-primary-600',
            bg: 'bg-primary-50',
          },
          {
            label: 'รอดำเนินการ',
            value: data?.pendingCount ?? 0,
            icon: Clock3,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'กำลังดำเนินการ',
            value: data?.inProgressCount ?? 0,
            icon: AlertCircle,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
          },
          {
            label: 'ปิดเคสแล้ว',
            value: data?.completedCount ?? 0,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
        ].map((item, idx) => (
          <Card key={idx} className="p-4 border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {item.value}
                </p>
              </div>
              <div className={cn('p-2 rounded-lg', item.bg, item.color)}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main layout: schedule + summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* ตารางงาน (2 cols) */}
        <div className="xl:col-span-2">
          <Card className="border-gray-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">ตารางงานในวันที่เลือก</p>
                <p className="text-sm font-semibold text-gray-800">
                  {formatThaiDate(selectedDate, { includeDay: true })}
                </p>
              </div>
              {isMutating && (
                <span className="text-xs text-primary-500 flex items-center gap-1">
                  <LoadingSpinner size="sm" />
                  กำลังบันทึกการเปลี่ยนแปลง...
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="py-16 flex items-center justify-center">
                <LoadingSpinner size="lg" label="กำลังโหลดรายการงาน..." />
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                ยังไม่มีงานที่ต้องดำเนินการในวันนี้
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <JobRow
                    key={job.id}
                    booking={job}
                    onTakeJob={handleTakeJob}
                    onChangeStatus={handleChangeStatus}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* สรุป / หมายเหตุ */}
        <div className="space-y-4">
          <Card className="p-4 border-gray-200 shadow-sm rounded-2xl">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary-500 rounded-full" />
              หมายเหตุการใช้งาน
            </h3>
            <ul className="text-xs text-gray-600 space-y-2">
              <li>
                • งานที่ยังไม่มีผู้รับผิดชอบจะแสดงปุ่ม{' '}
                <span className="font-semibold text-primary-600">
                  "รับเคสนี้"
                </span>{' '}
                เพื่อให้คุณรับมาดูแลเอง
              </li>
              <li>
                • เมื่อเริ่มการให้คำปรึกษา ให้กด{' '}
                <span className="font-semibold">"เริ่มให้คำปรึกษา"</span>{' '}
                เพื่อเปลี่ยนสถานะเป็น{' '}
                <span className="font-semibold text-indigo-600">
                  กำลังดำเนินการ
                </span>
              </li>
              <li>
                • หลังให้คำปรึกษาเสร็จสิ้น ให้กด{' '}
                <span className="font-semibold text-emerald-600">
                  "ปิดเคส"
                </span>{' '}
                เพื่อเก็บในสถิติ
              </li>
            </ul>
          </Card>

          <Card className="p-4 border-gray-200 shadow-sm rounded-2xl">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary-500" />
              ภาพรวมเวลาให้บริการของคุณวันนี้
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <p className="flex justify-between">
                <span>จำนวนเคสทั้งหมด</span>
                <span className="font-semibold">{jobs.length} เคส</span>
              </p>
              <p className="flex justify-between">
                <span>รอดำเนินการ</span>
                <span className="font-semibold text-amber-600">
                  {jobs.filter((b) => b.status === 'CONFIRMED' || b.status === 'ASSIGNED').length}
                </span>
              </p>
              <p className="flex justify-between">
                <span>กำลังดำเนินการ</span>
                <span className="font-semibold text-indigo-600">
                  {jobs.filter((b) => b.status === 'IN_PROGRESS').length}
                </span>
              </p>
              <p className="flex justify-between">
                <span>เสร็จสิ้น</span>
                <span className="font-semibold text-emerald-600">
                  {jobs.filter((b) => b.status === 'COMPLETED').length}
                </span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🔹 แถวแสดงงานหนึ่งเคส
// ==========================================

interface JobRowProps {
  booking: Booking;
  onTakeJob: (bookingId: string) => void;
  onChangeStatus: (bookingId: string, status: string) => void;
}

function JobRow({ booking, onTakeJob, onChangeStatus }: JobRowProps) {
  const isUnassigned = !booking.consultantId;
  const isCompleted = booking.status === 'COMPLETED';
  const isInProgress = booking.status === 'IN_PROGRESS';
  const isCancelled = booking.status === 'CANCELLED';

  const statusBadge = getStatusBadge(booking.status);

  return (
    <div className="px-5 py-3 flex flex-col md:flex-row md:items-center gap-3">
      {/* เวลา + สายเวลา */}
      <div className="flex items-start gap-3 md:w-48">
        <div className="mt-0.5 text-xs font-mono text-gray-700 flex items-center gap-1">
          <Clock3 className="w-3.5 h-3.5 text-gray-400" />
          <span>
            {booking.startTime} - {booking.endTime}
          </span>
        </div>
      </div>

      {/* รายละเอียดผู้รับบริการ */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center">
            <User2 className="w-4 h-4 text-primary-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {booking.userName || 'ไม่ทราบชื่อ'}
            </p>
            {booking.problemType && (
              <p className="text-[11px] text-gray-500">
                {booking.problemType}
              </p>
            )}
          </div>
        </div>
        {booking.problemDescription && (
          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
            {booking.problemDescription}
          </p>
        )}
      </div>

      {/* สถานะ */}
      <div className="md:w-32 flex md:justify-center">
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
            statusBadge.className,
          )}
        >
          {statusBadge.icon}
          <span className="ml-1">{statusBadge.label}</span>
        </span>
      </div>

      {/* ปุ่มจัดการ */}
      <div className="flex flex-wrap md:flex-nowrap gap-2 md:justify-end md:w-72">
        {isUnassigned && !isCompleted && !isCancelled && (
          <Button
            size="sm"
            variant="outline"
            className="border-primary-300 text-primary-700 hover:bg-primary-50 text-xs"
            onClick={() => onTakeJob(booking.id)}
          >
            รับเคสนี้
          </Button>
        )}

        {!isCompleted && !isCancelled && (
          <>
            {!isInProgress && (
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs"
                onClick={() => onChangeStatus(booking.id, 'IN_PROGRESS')}
              >
                เริ่มให้คำปรึกษา
              </Button>
            )}
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs"
              onClick={() => onChangeStatus(booking.id, 'COMPLETED')}
            >
              ปิดเคส
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// แปลง status -> badge
function getStatusBadge(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return {
        label: 'กำลังดำเนินการ',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: <Clock3 className="w-3 h-3" />,
      };
    case 'COMPLETED':
      return {
        label: 'เสร็จสิ้น',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    case 'CANCELLED':
      return {
        label: 'ยกเลิก',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <AlertCircle className="w-3 h-3" />,
      };
    case 'ASSIGNED':
    case 'CONFIRMED':
    default:
      return {
        label: 'รอดำเนินการ',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Clock3 className="w-3 h-3" />,
      };
  }
}
