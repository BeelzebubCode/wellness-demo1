// src/components/admin/bookings/BookingDetailModal.tsx
'use client';

import React from 'react';
import { X, Calendar, Clock, User, Phone, Mail, Building, MessageSquare } from 'lucide-react';
import { StatusBadge, Avatar } from '@/components/shared';
import { Modal } from '@/components/ui';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: number;
    studentName: string;
    studentCode?: string;
    problemType: string;
    detailText?: string;
    status: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    student?: {
      email?: string;
      phone?: string;
      faculty?: string;
      department?: string;
    };
    consultant?: {
      name: string;
      email?: string;
      phone?: string;
    };
    outcome?: {
      note: string;
      nextStep?: string;
      riskLevel?: number;
    };
  } | null;
  onAssign?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  onAssign,
  onStart,
  onComplete,
  onCancel,
}: BookingDetailModalProps) {
  if (!booking) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="รายละเอียดการนัดหมาย" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={booking.studentName} size="lg" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{booking.studentName}</h3>
              {booking.studentCode && (
                <p className="text-sm text-slate-500">{booking.studentCode}</p>
              )}
            </div>
          </div>
          <StatusBadge status={booking.status} size="lg" />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Schedule */}
          {booking.date && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">วันที่</p>
                <p className="font-medium text-slate-900">{booking.date}</p>
              </div>
            </div>
          )}
          {booking.startTime && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Clock className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">เวลา</p>
                <p className="font-medium text-slate-900">{booking.startTime} - {booking.endTime}</p>
              </div>
            </div>
          )}
          
          {/* Student Info */}
          {booking.student?.faculty && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Building className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">คณะ</p>
                <p className="font-medium text-slate-900">{booking.student.faculty}</p>
              </div>
            </div>
          )}
          {booking.student?.phone && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Phone className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">โทรศัพท์</p>
                <p className="font-medium text-slate-900">{booking.student.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Problem */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-amber-600" />
            <h4 className="font-semibold text-amber-900">ประเภทปัญหา</h4>
          </div>
          <p className="text-amber-800 font-medium">{booking.problemType}</p>
          {booking.detailText && (
            <p className="mt-2 text-sm text-amber-700">{booking.detailText}</p>
          )}
        </div>

        {/* Consultant */}
        {booking.consultant && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">ผู้ให้คำปรึกษา</h4>
            </div>
            <p className="text-blue-800 font-medium">{booking.consultant.name}</p>
            {booking.consultant.email && (
              <p className="text-sm text-blue-700">{booking.consultant.email}</p>
            )}
          </div>
        )}

        {/* Outcome */}
        {booking.outcome && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <h4 className="font-semibold text-emerald-900 mb-2">ผลการให้คำปรึกษา</h4>
            <p className="text-emerald-800">{booking.outcome.note}</p>
            {booking.outcome.nextStep && (
              <div className="mt-2 pt-2 border-t border-emerald-200">
                <p className="text-sm text-emerald-700">
                  <strong>ขั้นตอนถัดไป:</strong> {booking.outcome.nextStep}
                </p>
              </div>
            )}
            {booking.outcome.riskLevel !== undefined && (
              <div className="mt-2">
                <p className="text-sm text-emerald-700">
                  <strong>ระดับความเสี่ยง:</strong> {booking.outcome.riskLevel}/5
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
          {booking.status === 'PENDING_ASSIGNMENT' && onAssign && (
            <button
              onClick={onAssign}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              มอบหมายงาน
            </button>
          )}
          {booking.status === 'ASSIGNED' && onStart && (
            <button
              onClick={onStart}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              เริ่มให้คำปรึกษา
            </button>
          )}
          {booking.status === 'IN_PROGRESS' && onComplete && (
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              บันทึกผล
            </button>
          )}
          {['PENDING_ASSIGNMENT', 'ASSIGNED'].includes(booking.status) && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              ยกเลิก
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium ml-auto"
          >
            ปิด
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default BookingDetailModal;