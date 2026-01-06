'use client';

import { Button, Badge, Card } from '@/components/ui';
import {
  Calendar, Clock, Briefcase, RefreshCw,
  AlertCircle, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { DataCenterItem, BookingStatus } from '@/types/data-center';

interface ConsultationTableProps {
  data: DataCenterItem[];
}

export default function ConsultationTable({ data }: ConsultationTableProps) {
  return (
    <Card className="border border-gray-200 shadow-sm overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 min-w-[220px]">นิสิต / คณะ</th>
              <th className="px-4 py-3 min-w-[180px]">การจอง / สถานะ</th>
              <th className="px-4 py-3 min-w-[200px]">ผู้ให้คำปรึกษา / โหลดงาน</th>
              <th className="px-4 py-3 min-w-[140px]">สถิตินิสิต</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  ไม่พบข้อมูลตามเงื่อนไข
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  {/* Student */}
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">
                        {item.studentName}
                      </span>
                      <span className="text-xs text-gray-500 font-mono mb-1">
                        {item.studentId || '-'}
                      </span>

                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.faculty && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-white font-normal text-gray-600 border border-gray-200"
                          >
                            {item.faculty}
                          </Badge>
                        )}

                        {item.degree && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-white font-normal text-gray-600 border border-gray-200"
                          >
                            {item.degree} ปี {item.year}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Booking */}
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-2">
                      <StatusBadge status={item.status} />

                      <div>
                        <p className="text-gray-800 font-medium text-xs">
                          {item.problemType}
                        </p>

                        {item.isRepeatTopic && (
                          <span className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                            <RefreshCw className="w-3 h-3" />
                            จองเรื่องเดิมซ้ำ
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.date}
                        <span className="mx-1">|</span>
                        <Clock className="w-3 h-3" />
                        {item.timeSlot}
                      </div>
                    </div>
                  </td>

                  {/* Consultant */}
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-800 font-medium">
                        {item.consultantName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.expertise || '-'}
                      </span>

                      <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                          <Briefcase className="w-3 h-3" />
                          {item.currentLoad} คิว
                        </span>

                        {item.satisfactionScore != null && (
                          <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100">
                            ★ {item.satisfactionScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1.5 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">จองทั้งหมด:</span>
                        <span className="font-medium text-gray-800">
                          {item.bookingCount}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">ไม่มาตามนัด:</span>
                        <span
                          className={cn(
                            'font-medium',
                            item.noShowCount > 0
                              ? 'text-rose-600'
                              : 'text-gray-800',
                          )}
                        >
                          {item.noShowCount}
                        </span>
                      </div>

                      {item.noShowCount >= 2 && (
                        <div className="flex items-center gap-1 text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          ความเสี่ยงสูง
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 align-top text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (static) */}
      <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
        <span className="text-xs text-gray-500">
          แสดง {data.length} รายการ
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white h-8 text-xs"
            disabled
          >
            ก่อนหน้า
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white h-8 text-xs"
          >
            ถัดไป
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ---------------- Helper ----------------

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-purple-100 text-purple-700 border-purple-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
    NO_SHOW: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  const labels: Record<string, string> = {
    PENDING: 'รอพิจารณา',
    CONFIRMED: 'อนุมัติแล้ว',
    IN_PROGRESS: 'ดำเนินการอยู่',
    COMPLETED: 'เสร็จสิ้น',
    CANCELLED: 'ยกเลิก',
    NO_SHOW: 'ไม่มาตามนัด',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
};
