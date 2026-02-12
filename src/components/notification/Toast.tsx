// src/components/notification/Toast.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useNotificationContext } from "./NotificationProvider";
import { AlertTriangle, CheckCircle2, Info, X, Trophy, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  reward: Trophy,
};

const toneRing = {
  success: "ring-emerald-200/60",
  error: "ring-red-200/70",
  warning: "ring-amber-200/70",
  info: "ring-sky-200/70",
  reward: "ring-amber-300/50",
};

const toneDot = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  reward: "bg-gradient-to-r from-amber-400 to-orange-500",
};

const EXIT_MS = 220;

export function ToastHost() {
  const { notifications, clear } = useNotificationContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!notifications.length) return;

    const timers = notifications.map((n) => {
      return window.setTimeout(() => clear(n.id), n.duration ?? 2500);
    });

    return () => timers.forEach(window.clearTimeout);
  }, [mounted, notifications, clear]);

  if (!mounted) return null;

  const ui = (
    <div className="pointer-events-none fixed top-[env(safe-area-inset-top,1rem)] left-1/2 z-[9999] w-[min(92vw,420px)] -translate-x-1/2">
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {notifications.map((n) => {
            const Icon = iconMap[n.type];
            const isReward = n.type === "reward";

            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                className={cn(
                  "pointer-events-auto relative rounded-3xl border bg-white shadow-[0_16px_48px_-8px_rgba(2,6,23,0.15)]",
                  "ring-1 overflow-hidden",
                  toneRing[n.type],
                  isReward && "border-amber-200 bg-gradient-to-br from-white to-amber-50/30"
                )}
              >
                {/* Decoration for Reward */}
                {isReward && (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute -right-8 -top-8 text-amber-200/20"
                    >
                      <Sparkles size={80} />
                    </motion.div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400" />
                  </>
                )}

                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="relative shrink-0">
                    <div className={cn("mt-0 h-2 w-2 rounded-full hidden", toneDot[n.type])} />
                  </div>

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100 shadow-sm">
                    <Icon className={cn("h-4 w-4", isReward ? "text-amber-500" : "text-slate-700 opacity-85")} />
                  </div>

                  <div className="min-w-0 flex-1 flex items-center gap-2 overflow-hidden">
                    {n.title ? (
                      <span className={cn(
                        "text-sm font-bold whitespace-nowrap shrink-0",
                        isReward ? "text-amber-900" : "text-slate-900"
                      )}>
                        {n.title}
                      </span>
                    ) : null}
                    <span className={cn(
                      "text-sm truncate",
                      isReward ? "text-amber-800" : "text-slate-600"
                    )}>
                      {n.message}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => clear(n.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0 ml-1"
                    aria-label="close toast"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress bar (Visual only) */}
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: (n.duration ?? 2500) / 1000, ease: "linear" }}
                  className={cn("h-1 w-full origin-left", toneDot[n.type])}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );

  return createPortal(ui, document.body);
}
