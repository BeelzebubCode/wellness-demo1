'use client';

import { Button } from '@/components/ui';
import { Sunrise, Sun, Moon } from 'lucide-react';

export type TimePeriod = 'morning' | 'afternoon' | 'evening';

interface Props {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

export function TimePeriodTabs({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 mb-3">
      <Button
        size="sm"
        variant={value === 'morning' ? 'primary' : 'outline'}
        onClick={() => onChange('morning')}
        className="flex items-center gap-1.5"
      >
        <Sunrise className="w-4 h-4" />
        ช่วงเช้า
      </Button>

      <Button
        size="sm"
        variant={value === 'afternoon' ? 'primary' : 'outline'}
        onClick={() => onChange('afternoon')}
        className="flex items-center gap-1.5"
      >
        <Sun className="w-4 h-4" />
        ช่วงบ่าย
      </Button>

      <Button
        size="sm"
        variant={value === 'evening' ? 'primary' : 'outline'}
        onClick={() => onChange('evening')}
        className="flex items-center gap-1.5"
      >
        <Moon className="w-4 h-4" />
        ช่วงเย็น
      </Button>
    </div>
  );
}
