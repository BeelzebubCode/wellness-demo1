// src/components/notification/Toast.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useNotificationContext } from './NotificationProvider';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const iconMap = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const toneRing = {
  success: 'ring-emerald-200/60',
  error: 'ring-red-200/70',
  warning: 'ring-amber-200/70',
  info: 'ring-sky-200/70',
};

const toneDot = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
};

const EXIT_MS = 220; // เวลาแอนิเมชั่นตอนออก

export function ToastHost() {
  const { notifications, clear } = useNotificationContext();
  const [closingIds, setClosingIds] = useState<Set<string>>(new Set());

  const requestClose = (id: string) => {
    setClosingIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => clear(id), EXIT_MS);
  };

  // auto dismiss (ให้เริ่มนับเมื่อ toast "อยู่บนจอแล้ว")
  useEffect(() => {
    const timers = notifications.map((n) => {
      const ms = n.duration ?? 1600;
      return window.setTimeout(() => requestClose(n.id), ms);
    });

    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.map((n) => n.id).join('|')]); // กัน loop

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-[9999] w-[min(92vw,420px)] -translate-x-1/2">
      <div className="flex flex-col gap-2">
        {notifications.map((n) => {
          const Icon = iconMap[n.type];
          const isClosing = closingIds.has(n.id);

          return (
            <div
              key={n.id}
              className={cn(
                'pointer-events-auto rounded-2xl border bg-white shadow-[0_12px_40px_rgba(2,6,23,0.12)]',
                'ring-1',
                toneRing[n.type],
                // ---- animation core ----
                'transform-gpu transition-all duration-200 ease-out will-change-transform',
                !isClosing
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 -translate-y-2 scale-[0.98]'
              )}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                {/* left indicator */}
                <span className={cn('mt-1 h-2.5 w-2.5 rounded-full', toneDot[n.type])} />

                <Icon className="mt-0.5 h-5 w-5 text-slate-700 opacity-85" />

                <div className="min-w-0 flex-1">
                  {n.title ? (
                    <p className="text-sm font-semibold text-slate-900 leading-5">
                      {n.title}
                    </p>
                  ) : null}
                  <p className={cn('text-sm leading-5 text-slate-700', n.title ? 'mt-0.5' : '')}>
                    {n.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => requestClose(n.id)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-700 transition"
                  aria-label="close toast"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* subtle bottom progress bar (optional) */}
              <div className="h-1 w-full overflow-hidden rounded-b-2xl bg-slate-100">
                <div
                  className={cn(
                    'h-full w-full origin-left scale-x-100',
                    'transition-transform ease-linear',
                    // ถ้าจะให้เป็นแถบเวลาจริง ๆ ต้อง set inline style duration ต่อรายการ
                    // ตอนนี้เอาไว้เป็น accent เฉย ๆ
                    toneDot[n.type]
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
