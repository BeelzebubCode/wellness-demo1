// src/features/booking/components/slots/TimePeriodTabs.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { Sunrise, Sun, Moon } from "lucide-react";
import type { SlotPeriod } from "../../utils/slotPeriod";

const TABS: Array<{
  key: SlotPeriod;
  label: string;
  Icon: React.ElementType;
}> = [
  { key: "MORNING", label: "ช่วงเช้า", Icon: Sunrise },
  { key: "AFTERNOON", label: "ช่วงบ่าย", Icon: Sun },
  { key: "EVENING", label: "ช่วงเย็น", Icon: Moon },
];

export function TimePeriodTabs({
  value,
  onChange,
}: {
  value: SlotPeriod;
  onChange: (v: SlotPeriod) => void;
}) {
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
              variant={active ? "primary" : "outline"}
              onClick={() => onChange(key)}
              className={cn(
                "h-11 min-w-0 rounded-xl px-3",
                "flex items-center justify-center gap-2",
                "leading-none overflow-hidden",
                "transition-[flex] duration-300 ease-out",
                active ? "flex-[3]" : "flex-1",
                !active && "opacity-90",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span
                className={cn(
                  "whitespace-nowrap font-semibold",
                  "transition-all duration-200 ease-out",
                  active ? "opacity-100 translate-x-0 max-w-[120px]" : "opacity-0 -translate-x-1 max-w-0",
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
              variant={active ? "primary" : "outline"}
              onClick={() => onChange(key)}
              className={cn(
                "h-11 w-full rounded-xl",
                "flex items-center justify-center gap-2",
                "leading-none",
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
