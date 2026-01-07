'use client';

import { Button } from '@/components/ui';
import { Sunrise, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type TimePeriod = 'morning' | 'afternoon' | 'evening';

interface Props {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

export function TimePeriodTabs({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      {/* Morning */}
      <Button
        size="sm"
        variant={value === 'morning' ? 'primary' : 'outline'}
        onClick={() => onChange('morning')}
        className={cn(
          'h-11 w-full',
          'flex items-center justify-center gap-2',
          'leading-none'
        )}
      >
        <Sunrise className="w-4 h-4" />
        <span className="font-semibold">ช่วงเช้า</span>
      </Button>

      {/* Afternoon */}
      <Button
        size="sm"
        variant={value === 'afternoon' ? 'primary' : 'outline'}
        onClick={() => onChange('afternoon')}
        className={cn(
          'h-11 w-full',
          'flex items-center justify-center gap-2',
          'leading-none'
        )}
      >
        <Sun className="w-4 h-4" />
        <span className="font-semibold">ช่วงบ่าย</span>
      </Button>

      {/* Evening */}
      <Button
        size="sm"
        variant={value === 'evening' ? 'primary' : 'outline'}
        onClick={() => onChange('evening')}
        className={cn(
          'h-11 w-full',
          'flex items-center justify-center gap-2',
          'leading-none'
        )}
      >
        <Moon className="w-4 h-4" />
        <span className="font-semibold">ช่วงเย็น</span>
      </Button>
    </div>
  );
}
