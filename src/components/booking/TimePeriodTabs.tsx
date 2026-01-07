'use client';

import { Button } from '@/components/ui';
import { Sunrise, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type TimePeriod = 'morning' | 'afternoon' | 'evening';

interface Props {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

const TABS: Array<{
  key: TimePeriod;
  label: string;
  Icon: React.ElementType;
}> = [
  { key: 'morning', label: 'ช่วงเช้า', Icon: Sunrise },
  { key: 'afternoon', label: 'ช่วงบ่าย', Icon: Sun },
  { key: 'evening', label: 'ช่วงเย็น', Icon: Moon },
];

export function TimePeriodTabs({ value, onChange }: Props) {
  return (
    <>
      {/* ================= MOBILE (Animated) ================= */}
      <div className="mb-3 flex gap-2 md:hidden">
        {TABS.map(({ key, label, Icon }) => {
          const active = value === key;

          return (
            <Button
              key={key}
              size="sm"
              variant={active ? 'primary' : 'outline'}
              onClick={() => onChange(key)}
              className={cn(
                // ✅ base
                'h-11 min-w-0 rounded-xl px-3',
                'flex items-center justify-center gap-2',
                'leading-none overflow-hidden',
                // ✅ animation width (flex grow)
                'transition-[flex] duration-300 ease-out',
                active ? 'flex-[3]' : 'flex-1',
                // ✅ ให้ปุ่มที่ไม่ active ดูเบากว่า (optional)
                !active && 'opacity-90'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />

              {/* ✅ label จะโชว์/หายแบบนุ่ม ๆ */}
              <span
                className={cn(
                  'whitespace-nowrap font-semibold',
                  'transition-all duration-200 ease-out',
                  active
                    ? 'opacity-100 translate-x-0 max-w-[120px]'
                    : 'opacity-0 -translate-x-1 max-w-0'
                )}
              >
                {label}
              </span>
            </Button>
          );
        })}
      </div>

      {/* ================= DESKTOP (Normal) ================= */}
      <div className="hidden md:grid grid-cols-3 gap-2 mb-3">
        {TABS.map(({ key, label, Icon }) => {
          const active = value === key;

          return (
            <Button
              key={key}
              size="sm"
              variant={active ? 'primary' : 'outline'}
              onClick={() => onChange(key)}
              className={cn(
                'h-11 w-full rounded-xl',
                'flex items-center justify-center gap-2',
                'leading-none'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="font-semibold">{label}</span>
            </Button>
          );
        })}
      </div>
    </>
  );
}
