// src/components/shared/StatusBadge.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/cn';

type BookingStatus = 
  | 'PENDING_ASSIGNMENT' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

interface StatusBadgeProps {
  status: BookingStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING_ASSIGNMENT: {
    label: 'รอมอบหมาย',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  ASSIGNED: {
    label: 'มอบหมายแล้ว',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  IN_PROGRESS: {
    label: 'กำลังดำเนินการ',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  COMPLETED: {
    label: 'เสร็จสิ้น',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  CANCELLED: {
    label: 'ยกเลิก',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  // Time slot statuses
  AVAILABLE: {
    label: 'ว่าง',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  BOOKED: {
    label: 'จองแล้ว',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  LOCKED: {
    label: 'ปิด',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        sizeClasses[size],
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;