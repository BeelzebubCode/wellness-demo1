// src/components/notification/Toast.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useNotificationContext } from "./NotificationProvider";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const iconMap = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const toneRing = {
  success: "ring-emerald-200/60",
  error: "ring-red-200/70",
  warning: "ring-amber-200/70",
  info: "ring-sky-200/70",
};

const toneDot = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
};

const EXIT_MS = 220;

export function ToastHost() {
  const { notifications, clear } = useNotificationContext();
  const [closingIds, setClosingIds] = useState<Set<string>>(new Set());

  // ✅ 1) mounted flag (กัน hydration/portal)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const requestClose = (id: string) => {
    setClosingIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => clear(id), EXIT_MS);
  };

  // ✅ 2) auto dismiss (ต้องอยู่ "ก่อน return" เสมอ)
  useEffect(() => {
    if (!mounted) return;
    if (!notifications.length) return;

    const timers = notifications.map((n) => {
      const ms = n.duration ?? 1600;
      return window.setTimeout(() => requestClose(n.id), ms);
    });

    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, notifications.map((n) => n.id).join("|")]);

  // ✅ 3) หลัง hooks ครบแล้ว ค่อย return
  if (!mounted) return null;

  const ui = (
    <div className="pointer-events-none fixed top-4 left-1/2 z-[9999] w-[min(92vw,420px)] -translate-x-1/2">
      <div className="flex flex-col gap-2">
        {notifications.map((n) => {
          const Icon = iconMap[n.type];
          const isClosing = closingIds.has(n.id);

          return (
            <div
              key={n.id}
              className={cn(
                "pointer-events-auto rounded-2xl border bg-white shadow-[0_12px_40px_rgba(2,6,23,0.12)]",
                "ring-1",
                toneRing[n.type],
                "transform-gpu transition-all duration-200 ease-out will-change-transform",
                !isClosing
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-2 scale-[0.98]"
              )}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", toneDot[n.type])} />
                <Icon className="mt-0.5 h-5 w-5 text-slate-700 opacity-85" />

                <div className="min-w-0 flex-1">
                  {n.title ? (
                    <p className="text-sm font-semibold text-slate-900 leading-5">
                      {n.title}
                    </p>
                  ) : null}
                  <p className={cn("text-sm leading-5 text-slate-700", n.title ? "mt-0.5" : "")}>
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

              <div className="h-1 w-full overflow-hidden rounded-b-2xl bg-slate-100">
                <div className={cn("h-full w-full", toneDot[n.type])} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return createPortal(ui, document.body);
}
