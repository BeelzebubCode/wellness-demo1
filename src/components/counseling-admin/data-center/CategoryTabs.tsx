// src/components/admin/data-center/CategoryTabs.tsx

'use client';

import { Users, UserCog, FolderOpen, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { DataCenterCategory } from '@/features/data-center/types';

interface CategoryTabsProps {
  value: DataCenterCategory;
  onChange: (category: DataCenterCategory) => void;
}

const TABS: { key: DataCenterCategory; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'STUDENTS', label: 'ผู้จองคิว', icon: Users, desc: 'รายชื่อนิสิตทั้งหมด' },
  { key: 'CONSULTANTS', label: 'ผู้ให้คำปรึกษา', icon: UserCog, desc: 'รายชื่อที่ปรึกษา' },
  { key: 'CATEGORIES', label: 'ประเภทเรื่อง', icon: FolderOpen, desc: 'หมวดหมู่ปัญหา' },
  { key: 'BOOKINGS', label: 'การจองคิว', icon: CalendarCheck, desc: 'รายการนัดหมาย' },
];

export default function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = value === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border transition-all text-left',
              isActive
                ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div
                className={cn(
                  'font-semibold text-sm',
                  isActive ? 'text-indigo-900' : 'text-gray-800'
                )}
              >
                {tab.label}
              </div>
              <div className="text-xs text-gray-500">{tab.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}