// src/components/shared/EmptyState.tsx
'use client';

import React from 'react';
import { Inbox, Search, Calendar, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/cn';

type EmptyStateType = 'default' | 'search' | 'calendar' | 'data';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const defaultContent: Record<EmptyStateType, { icon: React.ReactNode; title: string; description: string }> = {
  default: {
    icon: <Inbox className="w-12 h-12 text-slate-300" />,
    title: 'ไม่มีข้อมูล',
    description: 'ยังไม่มีข้อมูลในขณะนี้',
  },
  search: {
    icon: <Search className="w-12 h-12 text-slate-300" />,
    title: 'ไม่พบผลลัพธ์',
    description: 'ลองปรับคำค้นหาหรือตัวกรองใหม่',
  },
  calendar: {
    icon: <Calendar className="w-12 h-12 text-slate-300" />,
    title: 'ไม่มีการนัดหมาย',
    description: 'ยังไม่มีการนัดหมายในวันที่เลือก',
  },
  data: {
    icon: <FileQuestion className="w-12 h-12 text-slate-300" />,
    title: 'ไม่พบข้อมูล',
    description: 'ไม่พบข้อมูลที่ต้องการ',
  },
};

export function EmptyState({
  type = 'default',
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const content = defaultContent[type];

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="mb-4">
        {icon || content.icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">
        {title || content.title}
      </h3>
      <p className="text-sm text-slate-500 text-center max-w-sm">
        {description || content.description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;