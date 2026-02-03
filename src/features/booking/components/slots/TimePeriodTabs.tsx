"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import type { SlotPeriod } from "../../utils/slotPeriod";

const items: Array<{ key: SlotPeriod; label: string }> = [
  { key: "ALL", label: "ทั้งหมด" },
  { key: "MORNING", label: "เช้า" },
  { key: "AFTERNOON", label: "บ่าย" },
  { key: "EVENING", label: "เย็น" },
];

export function TimePeriodTabs({
  value,
  onChange,
}: {
  value: SlotPeriod;
  onChange: (v: SlotPeriod) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {items.map((it) => (
        <Button
          key={it.key}
          variant={value === it.key ? "primary" : "ghost"}
          onClick={() => onChange(it.key)}
        >
          {it.label}
        </Button>
      ))}
    </div>
  );
}
