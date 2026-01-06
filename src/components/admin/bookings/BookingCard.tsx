// src/components/admin/bookings/BookingCard.tsx
'use client';

import React from 'react';
import { Calendar, Clock, User, MessageSquare, MoreVertical } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { cn } from '@/lib/cn';

interface BookingCardProps {
  booking: {
    id: number;
    studentName: string;
    studentCode?: string;
    problemType: string;
    status: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    consultantName?: string;
  };
  onClick?: () => void;
  onAction?: (action: string) => void;
  className?: string;
}

export function BookingCard({ booking, onClick, onAction, className }: BookingCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {booking.studentName?.charAt(0) || '?'}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{booking.studentName}</h4>
            {booking.studentCode && (
              <p className="text-xs text-slate-500">{booking.studentCode}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} size="sm" />
          {onAction && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-slate-500" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('view');
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    ดูรายละเอียด
                  </button>
                  {booking.status === 'PENDING_ASSIGNMENT' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction('assign');
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      มอบหมายงาน
                    </button>
                  )}
                  {booking.status === 'ASSIGNED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction('start');
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      เริ่มให้คำปรึกษา
                    </button>
                  )}
                  {booking.status === 'IN_PROGRESS' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction('complete');
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      บันทึกผล
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>{booking.problemType}</span>
        </div>
        {booking.date && (
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{booking.date}</span>
          </div>
        )}
        {booking.startTime && (
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{booking.startTime} - {booking.endTime}</span>
          </div>
        )}
        {booking.consultantName && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <span>{booking.consultantName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingCard;