// src/features/ai/components/AiChatHeader.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, ChevronDown } from "lucide-react";
import { AiChatMode } from "./AiChatCore";
import { cn } from "@/lib/cn";
import styles from "./aiChatTheme.module.css";

type ModeOption = {
  value: AiChatMode;
  title: string;
  desc: string;
};

const MODE_OPTIONS: ModeOption[] = [
  { value: "help", title: "AI Help Center", desc: "ถามตอบ/คู่มือ/อธิบายระบบ" },
  { value: "booking_agent", title: "AI Booking Agent", desc: "จองคิว/ยกเลิก → Plan → Confirm" },
];

export default function AiChatHeader({
  mode,
  onModeChange,
}: {
  mode: AiChatMode;
  onModeChange?: (mode: AiChatMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const current = useMemo(
    () => MODE_OPTIONS.find((x) => x.value === mode) ?? MODE_OPTIONS[0],
    [mode],
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (wrapRef.current?.contains(t)) return;
      setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border">
          <Bot className="h-5 w-5 text-slate-700" />
        </div>

        <div className="flex flex-col">
          {/* ✅ คุม font จาก CSS module */}
          <div className={cn("font-semibold text-slate-900", styles.headerTitle)}>
            {current.title}
          </div>
          <div className={cn("text-slate-400", styles.headerDesc)}>{current.desc}</div>
        </div>
      </div>
    </div>
  );
}
